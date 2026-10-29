import { describe, it, expect, beforeEach } from 'vitest';
import { localStore } from '../services/storageService';
import { INITIAL_MOCK_USER } from '../services/mockData';

describe('Student Profile & Storage Isolation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and updates student profile records', () => {
    const profile = localStore.getProfile();
    expect(profile.full_name).toBe(INITIAL_MOCK_USER.full_name);

    const updated = localStore.saveProfile({
      full_name: 'Devika Krishnan',
      roll_number: '21CS099',
    });

    expect(updated.full_name).toBe('Devika Krishnan');
    expect(updated.roll_number).toBe('21CS099');

    const retrieved = localStore.getProfile();
    expect(retrieved.full_name).toBe('Devika Krishnan');
  });

  it('preserves institutional safety resources while allowing personal contact deletions', () => {
    const initialSafety = localStore.getSafetyResources();
    const institutional = initialSafety.filter((s) => s.is_institutional);
    expect(institutional.length).toBeGreaterThan(0);

    // Add personal contact
    const contact = localStore.addPersonalSafetyContact({
      user_id: 'usr_1',
      category: 'personal',
      title: 'Local Guardian',
      phone: '+91 99999 11111',
      hours: 'Personal',
      is_verified: true,
    });

    const withPersonal = localStore.getSafetyResources();
    expect(withPersonal.some((s) => s.id === contact.id)).toBe(true);

    // Institutional resources cannot be deleted by general delete action
    localStore.deleteSafetyResource(institutional[0].id);
    const afterAttempt = localStore.getSafetyResources();
    expect(afterAttempt.some((s) => s.id === institutional[0].id)).toBe(true);

    // Personal resource can be deleted
    localStore.deleteSafetyResource(contact.id);
    const afterDelete = localStore.getSafetyResources();
    expect(afterDelete.some((s) => s.id === contact.id)).toBe(false);
  });
});
