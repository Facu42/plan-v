import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { PatientInvite } from '../../api/client';
import type { Patient } from '../../types';
import { InviteShare } from './ShowroomPatients';
import { createPatientWithInvitation, invitationReady } from './patient-invite-actions';

const invite = { id: 'i1', patient_id: 'p1', email: 'patient@example.test', status: 'not_sent', expires_at: null } as PatientInvite;
const created = { patient: { id: 'p1', name: 'Ana' } as Patient, invite, source: 'supabase' };
describe('alta e invitación sin falso éxito', () => {
  it('conserva la ficha y su ID si falla preparar acceso, sin repetir el alta', async () => {
    const create = vi.fn().mockResolvedValue(created); const activate = vi.fn().mockRejectedValue(new Error('Offline'));
    const result = await createPatientWithInvitation({ name: 'Ana', email: invite.email, goal: 'Organizar comidas' }, { create, activate });
    expect(result).toBe(created); expect(create).toHaveBeenCalledTimes(1); expect(activate).toHaveBeenCalledExactlyOnceWith('i1');
    expect(invitationReady(result.invite)).toBe(false);
  });
  it('un alta fallida no intenta activar ni genera un resultado exitoso', async () => {
    const activate = vi.fn(); const error = new Error('Invalid');
    await expect(createPatientWithInvitation({ name: '', email: '', goal: '' }, { create: vi.fn().mockRejectedValue(error), activate })).rejects.toBe(error);
    expect(activate).not.toHaveBeenCalled();
  });
  it('recuperar una cuenta vinculada no reactiva el enlace ni propone otra invitación', async () => {
    const accepted = { ...created, invite: { ...invite, status: 'accepted' as const } };
    const activate = vi.fn();
    expect(await createPatientWithInvitation({name:'Ana',email:invite.email,goal:'Comidas'}, {create:vi.fn().mockResolvedValue(accepted),activate})).toBe(accepted);
    expect(activate).not.toHaveBeenCalled();
    const html=renderToStaticMarkup(<InviteShare name="Ana" invite={accepted.invite} onClose={()=>undefined}/>);
    expect(html).toContain('Cuenta vinculada');expect(html).not.toContain('Reintentar preparar invitación');expect(html).not.toContain('Enlace de invitación');
  });
  it('recuperar un enlace vigente conserva su vencimiento sin volver a enviarlo', async () => {
    const pending = {...created,invite:{...invite,status:'pending' as const,expires_at:'2099-10-10T15:00:00Z'}};
    const activate=vi.fn();
    expect(await createPatientWithInvitation({name:'Ana',email:invite.email,goal:'Comidas'},{create:vi.fn().mockResolvedValue(pending),activate})).toBe(pending);
    expect(activate).not.toHaveBeenCalled();
  });
  it('muestra enlace sólo si el servidor confirma pending con vencimiento vigente', async () => {
    const pending = { ...invite, status: 'pending' as const, expires_at: '2099-10-10T15:00:00Z' };
    const result = await createPatientWithInvitation({ name: 'Ana', email: invite.email, goal: 'Comidas' }, { create: vi.fn().mockResolvedValue(created), activate: vi.fn().mockResolvedValue({ invite: pending, source: 'supabase' }) });
    expect(invitationReady(result.invite)).toBe(true);
    const html = renderToStaticMarkup(<InviteShare name="Ana" invite={result.invite} onClose={() => undefined} />);
    expect(html).toContain('Invitación lista'); expect(html).toContain('Enlace de invitación'); expect(html).toContain('WhatsApp'); expect(html).toContain('2099'); expect(html).not.toContain('7 días');
  });
  it.each([invite, { ...invite, status: 'pending' as const, expires_at: '2020-01-01T00:00:00Z' }, { ...invite, status: 'revoked' as const, expires_at: '2099-01-01T00:00:00Z' }])('no ofrece compartir un acceso no habilitado (%j)', value => {
    const html = renderToStaticMarkup(<InviteShare name="Ana" invite={value} onClose={() => undefined} />);
    expect(html).toContain('Ficha creada'); expect(html).toContain('Reintentar preparar invitación');
    expect(html).not.toContain('Invitación lista'); expect(html).not.toContain('Enlace de invitación'); expect(html).not.toContain('WhatsApp');
  });
});
