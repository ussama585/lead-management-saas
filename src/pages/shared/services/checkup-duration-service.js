import api from './api.js';

/**
 * @returns {Promise<{ status?: boolean, results?: Array<{ id: number, duration_minutes: number, created_at?: string, updated_at?: string }> }>}
 */
export async function listCheckupDurations() {
  const res = await api.get('/checkup-duration-list');
  return res.data;
}

/**
 * @returns {Promise<{ status?: boolean, data?: { id: number, duration_minutes: number, created_at?: string, updated_at?: string } }>}
 */
export async function getCheckupDuration(id) {
  const res = await api.get(`/checkup-duration-get/${id}`);
  return res.data;
}

/**
 * @returns {Promise<{ status?: boolean, message?: string, data?: object }>}
 */
export async function updateCheckupDuration(durationMinutes, id) {
  const res = await api.patch(`/checkup-duration-get/${id}`, {
    duration_minutes: durationMinutes,
  });
  return res.data;
}

/**
 * Delete a duration row by id.
 * @returns {Promise<{ status?: boolean, message?: string, data?: object }>}
 */
export async function deleteCheckupDuration(id) {
  const res = await api.delete(`/checkup-duration-get/${id}`);
  return res.data;
}
