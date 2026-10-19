import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {appendSavedReply,MessageReplyTools} from './MessageReplyTools';
import {FigmaRecordDialog} from './FigmaPatientFront';
it('usar una respuesta conserva el texto escrito y respeta el límite del chat',()=>{
 expect(appendSavedReply('Ya escribí esto.','Recordá el agua.')).toBe('Ya escribí esto.\n\nRecordá el agua.');
 expect(appendSavedReply('','Hola.')).toBe('Hola.');
 expect(()=>appendSavedReply('x'.repeat(1990),'Respuesta de más de diez caracteres')).toThrow();
});
it('dos diálogos conservan títulos accesibles independientes',()=>{
 const html=renderToStaticMarkup(<><FigmaRecordDialog title="Perfil" onClose={vi.fn()}>Perfil</FigmaRecordDialog><FigmaRecordDialog title="Respuestas" onClose={vi.fn()}>Editar</FigmaRecordDialog></>);
 const labels=[...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(match=>match[1]);
 expect(labels).toHaveLength(2);expect(new Set(labels).size).toBe(2);
 for(const id of labels)expect(html).toContain(`id="${id}"`);
});
it('las respuestas se ofrecen para insertar; su edición y sus errores son visibles',()=>{
 const html=renderToStaticMarkup(<MessageReplyTools tools={{data:{revision:'00000000-0000-4000-a000-000000000001',replies:[{id:'00000000-0000-4000-a000-000000000002',title:'Agua',body:'¿Cómo venís con el agua?'}],starred_patient_ids:[]},error:'Error de prueba',loading:false,busy:false,reload:vi.fn(),save:vi.fn()}} onUse={vi.fn()}/>);
 expect(html).toContain('Respuestas guardadas');expect(html).toContain('Usar respuesta Agua');expect(html).toContain('Editar respuestas');expect(html).toContain('Error de prueba');expect(html).toContain('Reintentar respuestas');
});
