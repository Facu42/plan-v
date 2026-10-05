import { writeWasRejected } from '../../../api/write-outcome';
import { sendShowroomMessage } from '../../../components/nutrigo/message-send';
import { createPendingWrite } from './pending-write';
import { assertChatFilename } from '../../../api/chat-file';

type Uploaded = { asset_id: string; filename: string };
type Services = Parameters<typeof sendShowroomMessage>[1] & { upload: (file: File) => Promise<Uploaded> };
type Input = { text: string; file: File | null; client_id: string; uploaded?: Uploaded; messageStarted?: boolean };

export function createMessageWrite(patientId: string, services: Services) {
  return createPendingWrite(async (input: Input) => {
    if (input.file && !input.uploaded) input.uploaded = await services.upload(input.file);
    if (input.uploaded) assertChatFilename(input.uploaded.filename);
    input.messageStarted = true;
    return sendShowroomMessage({ patientId, role: 'patient', text: input.text, client_id: input.client_id, asset_id: input.uploaded?.asset_id, filename: input.uploaded?.filename }, services);
  }, (error, input) => input.messageStarted === true && !writeWasRejected(error));
}
