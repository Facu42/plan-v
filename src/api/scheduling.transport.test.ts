import {afterEach,expect,it,vi} from 'vitest';
vi.mock('../lib/supabase',()=>({getSessionToken:async()=> 'test-session'}));
import {schedulingApi} from './scheduling';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('keeps OAuth cookies and public booking credentials on the web origin even with a remote API configured',async()=>{
 vi.stubEnv('VITE_API_URL','https://api.example.org');
 const fetcher=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>new Response('{}',{status:200}));vi.stubGlobal('fetch',fetcher);
 await schedulingApi.connection('google');await schedulingApi.receipt('consultorio', 'booking', 'private-token');
 expect(fetcher.mock.calls[0][0]).toBe('/api/scheduling/connections/google/start');
 expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'include'});
 expect(fetcher.mock.calls[1][0]).toBe('/api/public/scheduling/consultorio/bookings/booking');
 expect(fetcher.mock.calls[1][1]).toMatchObject({headers:{'x-booking-token':'private-token'}});
});
