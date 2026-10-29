import { describe, it, expect, beforeEach } from 'vitest';
import { localStore } from '../services/storageService';

describe('Expense Tracking & Budget Validation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds and calculates expenses with budget limits', () => {
    // Add budget
    localStore.saveBudget(6000);
    const budget = localStore.getBudget();
    expect(budget.monthly_limit).toBe(6000);

    // Add expenses
    const exp1 = localStore.addExpense({
      user_id: 'usr_1',
      title: 'Lab Notebook',
      amount: 150,
      category: 'Books & Stationery',
      date: '2026-10-15',
      payment_method: 'UPI',
    });

    const exp2 = localStore.addExpense({
      user_id: 'usr_1',
      title: 'Hostel Mess Food',
      amount: 850,
      category: 'Food & Canteen',
      date: '2026-10-16',
      payment_method: 'UPI',
    });

    const expenses = localStore.getExpenses();
    expect(expenses.some((e) => e.id === exp1.id)).toBe(true);
    expect(expenses.some((e) => e.id === exp2.id)).toBe(true);

    // Update expense
    localStore.updateExpense(exp1.id, { amount: 200 });
    const updated = localStore.getExpenses().find((e) => e.id === exp1.id);
    expect(updated?.amount).toBe(200);

    // Delete expense
    localStore.deleteExpense(exp2.id);
    const afterDelete = localStore.getExpenses();
    expect(afterDelete.some((e) => e.id === exp2.id)).toBe(false);
  });
});
