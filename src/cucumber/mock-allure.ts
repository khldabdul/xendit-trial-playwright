export const mockAllure = {
  step: async <T>(name: string, body: () => Promise<T>): Promise<T> => {
    return await body();
  },
  attachment: () => {},
  epic: () => {},
  feature: () => {},
  story: () => {},
  label: () => {},
  severity: () => {},
  tag: () => {},
  description: () => {},
  descriptionHtml: () => {},
  link: () => {},
  parameter: () => {},
};

import { CustomWorld } from './world.js';

export const createCucumberReporter = (world: CustomWorld) => {
  return {
    ...mockAllure,
    attachment: (name: string, content: string | Buffer, options?: any) => {
      let mediaType = options?.contentType || 'text/plain';
      let body = typeof content === 'string' ? content : content.toString();

      if (mediaType === 'application/json' || typeof content === 'object') {
        body = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        mediaType = 'application/json';
      }

      // Attach the name as text first, then attach the JSON payload
      // Alternatively, we just use the name as part of the body if it's plain text.
      // But attaching it to Cucumber report will just label the attachment with the mediaType unless we manipulate it.
      // Cucumber HTML reporter usually lists attachments. Let's write the name out before the JSON block in plain text,
      // and then the JSON as a separate text/plain or application/json attachment.
      world.attach(`Attachment: ${name}`, 'text/plain');
      world.attach(body, mediaType);
    },
  };
};
