import { challanRepository } from '../repositories/challan.repository.js';
import { getClient } from '../config/db.js';
import { generateNextChallanNumber } from '../utils/challanNumber.js';
import { Challan, ChallanStatus, PaginatedResult, PaginationParams } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';

export interface CreateChallanItemInput {
  product_id: number;
  quantity: number;
}

export interface CreateChallanInput {
  customer_id: number;
  items: CreateChallanItemInput[];
  status?: ChallanStatus; // DRAFT or CONFIRMED
}

export class ChallanService {
  async getChallans(params: PaginationParams): Promise<PaginatedResult<Challan>> {
    return challanRepository.findAll(params);
  }

  async getChallanById(id: number): Promise<Challan> {
    const challan = await challanRepository.findById(id);
    if (!challan) {
      throw new AppError(`Challan with ID ${id} not found.`, 404);
    }
    return challan;
  }

  /**
   * Creates a new challan.
   * - If status === 'DRAFT': Inserts challan and items with product snapshot. Does NOT touch inventory.
   * - If status === 'CONFIRMED': Executes atomic transaction checking & deducting stock for every item.
   */
  async createChallan(input: CreateChallanInput, userId: number | null): Promise<Challan> {
    const status: ChallanStatus = input.status === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Verify customer exists
      const custRes = await client.query('SELECT id, customer_name FROM customers WHERE id = $1', [
        input.customer_id,
      ]);
      if (custRes.rows.length === 0) {
        throw new AppError(`Customer with ID ${input.customer_id} does not exist.`, 404);
      }

      // 2. Generate unique sequential Challan Number (e.g. CH-2026-0001)
      const challanNumber = await generateNextChallanNumber(client);

      // 3. Fetch product details for snapshot and inventory check
      // Consolidate quantities if user added the same product twice in different rows
      const consolidatedItems = new Map<number, number>();
      for (const item of input.items) {
        const existingQty = consolidatedItems.get(item.product_id) || 0;
        consolidatedItems.set(item.product_id, existingQty + item.quantity);
      }

      interface ItemSnapshot {
        product_id: number;
        product_name: string;
        sku: string;
        unit_price: number;
        quantity: number;
        total_price: number;
      }

      const snapshots: ItemSnapshot[] = [];
      let totalQuantity = 0;

      for (const [productId, qty] of consolidatedItems.entries()) {
        // Lock product row if confirming, or read row if draft
        const prodQuery = status === 'CONFIRMED'
          ? 'SELECT id, product_name, sku, unit_price, current_stock FROM products WHERE id = $1 FOR UPDATE'
          : 'SELECT id, product_name, sku, unit_price, current_stock FROM products WHERE id = $1';

        const prodRes = await client.query(prodQuery, [productId]);
        if (prodRes.rows.length === 0) {
          throw new AppError(`Product with ID ${productId} does not exist.`, 404);
        }

        const prod = prodRes.rows[0];
        const unitPrice = parseFloat(prod.unit_price);
        const totalPrice = parseFloat((unitPrice * qty).toFixed(2));

        // CRITICAL CHECK: If confirming, ensure sufficient stock
        if (status === 'CONFIRMED' && prod.current_stock < qty) {
          throw new AppError(
            `Insufficient stock for product ${prod.product_name}. Available: ${prod.current_stock}, Requested: ${qty}`,
            400
          );
        }

        snapshots.push({
          product_id: prod.id,
          product_name: prod.product_name,
          sku: prod.sku,
          unit_price: unitPrice,
          quantity: qty,
          total_price: totalPrice,
        });

        totalQuantity += qty;
      }

      // 4. Insert Challan Master Record
      const challanRes = await client.query(
        `INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [challanNumber, input.customer_id, totalQuantity, status, userId]
      );
      const challanId = challanRes.rows[0].id;

      // 5. Insert Challan Items with Product Snapshot
      for (const snap of snapshots) {
        await client.query(
          `INSERT INTO challan_items (
            challan_id, product_id, product_name_snapshot,
            sku_snapshot, unit_price_snapshot, quantity, total_price
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            challanId,
            snap.product_id,
            snap.product_name,
            snap.sku,
            snap.unit_price,
            snap.quantity,
            snap.total_price,
          ]
        );

        // 6. If CONFIRMED upon creation: Reduce stock & record OUT movement
        if (status === 'CONFIRMED') {
          await client.query(
            'UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [snap.quantity, snap.product_id]
          );

          await client.query(
            `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
             VALUES ($1, $2, 'OUT', $3, $4)`,
            [
              snap.product_id,
              snap.quantity,
              `Challan Confirmed: ${challanNumber}`,
              userId,
            ]
          );
        }
      }

      await client.query('COMMIT');

      const createdChallan = await challanRepository.findById(challanId);
      return createdChallan!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Confirms an existing DRAFT challan.
   * Atomically verifies stock, deducts inventory, records OUT movements, and marks status CONFIRMED.
   */
  async confirmChallan(id: number, userId: number | null): Promise<Challan> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Lock challan row FOR UPDATE
      const chRes = await client.query(
        'SELECT id, challan_number, status FROM challans WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (chRes.rows.length === 0) {
        throw new AppError(`Challan with ID ${id} not found.`, 404);
      }

      const challan = chRes.rows[0];

      // Prevent re-confirming or confirming cancelled challan
      if (challan.status === 'CONFIRMED') {
        throw new AppError('This challan is already confirmed and cannot be confirmed again.', 400);
      }

      if (challan.status === 'CANCELLED') {
        throw new AppError('Cannot confirm a cancelled challan.', 400);
      }

      // 2. Fetch all items for this challan
      const itemsRes = await client.query(
        `SELECT product_id, product_name_snapshot, quantity
         FROM challan_items
         WHERE challan_id = $1`,
        [id]
      );

      const items = itemsRes.rows;
      if (items.length === 0) {
        throw new AppError('Challan has no items to confirm.', 400);
      }

      // 3. Lock every product row and verify sufficient stock
      for (const item of items) {
        const prodRes = await client.query(
          'SELECT id, product_name, current_stock FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );

        if (prodRes.rows.length === 0) {
          throw new AppError(`Product with ID ${item.product_id} no longer exists.`, 400);
        }

        const product = prodRes.rows[0];

        // Critical stock check
        if (product.current_stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ${product.product_name}. Available: ${product.current_stock}, Requested: ${item.quantity}`,
            400
          );
        }
      }

      // 4. All stock checks passed! Deduct stock and record OUT movements
      for (const item of items) {
        await client.query(
          'UPDATE products SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [
            item.product_id,
            item.quantity,
            `Challan Confirmed: ${challan.challan_number}`,
            userId,
          ]
        );
      }

      // 5. Update Challan status to CONFIRMED
      await client.query(
        `UPDATE challans
         SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');

      const updatedChallan = await challanRepository.findById(id);
      return updatedChallan!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an existing challan.
   * If DRAFT: Marks CANCELLED.
   * If CONFIRMED: Restores stock and records IN stock movements.
   */
  async cancelChallan(id: number, userId: number | null): Promise<Challan> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const chRes = await client.query(
        'SELECT id, challan_number, status FROM challans WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (chRes.rows.length === 0) {
        throw new AppError(`Challan with ID ${id} not found.`, 404);
      }

      const challan = chRes.rows[0];

      if (challan.status === 'CANCELLED') {
        throw new AppError('This challan is already cancelled.', 400);
      }

      // If already CONFIRMED, restore stock
      if (challan.status === 'CONFIRMED') {
        const itemsRes = await client.query(
          'SELECT product_id, quantity FROM challan_items WHERE challan_id = $1',
          [id]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            'UPDATE products SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [item.quantity, item.product_id]
          );

          await client.query(
            `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
             VALUES ($1, $2, 'IN', $3, $4)`,
            [
              item.product_id,
              item.quantity,
              `Challan Cancelled Return: ${challan.challan_number}`,
              userId,
            ]
          );
        }
      }

      await client.query(
        `UPDATE challans SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');

      const updatedChallan = await challanRepository.findById(id);
      return updatedChallan!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const challanService = new ChallanService();
