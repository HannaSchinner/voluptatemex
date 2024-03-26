import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import winston from 'winston';

import { Axiom } from '@axiomhq/js';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

const datasetSuffix = process.env.AXIOM_DATASET_SUFFIX || 'local';

describe('WinstonTransport', () => {
  const datasetName = `test-axiom-js-winston-${datasetSuffix}`;
  const axiom = new Axiom();
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [new AxiomTransport({ dataset: datasetName })],
  });

  beforeAll(async () => {
    await axiom.datasets.create({
      name: datasetName,
      description: 'This is a test dataset for datasets integration tests.',
    });
  });

  afterAll(async () => {
    const resp = await axiom.datasets.delete(datasetName);
    expect(resp.status).toEqual(204);
  });

  it('sends logs to Axiom', async () => {
    logger.log({
      level: 'info',
      message: 'Hello from winston',
    });

    // Wait for the log to be sent
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const startTime = new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString();
    const endTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString();

    // const res = await axiom.datasets.query(`['${datasetName}']`, {
    //     startTime, endTime, streamingDuration: 'auto', noCache: false,
    // });

    const res = await axiom.queryLegacy(datasetName, {
      resolution: 'auto',
      startTime,
      endTime,
    });
    expect(res.matches).toHaveLength(1);
  });
});
