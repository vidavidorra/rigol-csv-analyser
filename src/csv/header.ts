import * as models from '../models/csv';
import fs from 'fs';
import parse from 'csv-parse/lib/sync';

export class CsvHeader {
  private path: string;
  private header: models.Header;
  private read: boolean;

  constructor(path: string) {
    this.path = path;
    this.read = false;
  }

  public Header(): Promise<models.Header> {
    if (this.read) {
      return Promise.resolve(this.header);
    }

    return this.Read().then(() => {
      return this.header;
    });
  }

  private Read(): Promise<void> {
    /**
     * CSV header from a Rigol DS1054Z.
     *
     * ```
     * X,CH1,CH2,Start,Increment,
     * Sequence,Volt,Volt,-5.999998e-02,2.000000e-05
     * ```
     */
    return new Promise((resolve, reject) => {
      /*
       * The header is expected to be less than 200 bytes. The following header
       * has 71 bytes, even with 4 channels it would be only 89 bytes.
       *
       * ```
       * X,CH1,CH2,Start,Increment,
       * Sequence,Volt,Volt,-5.999998e-02,2.000000e-05
       * ```
       */
      const headerBytes = 200;
      const readStream = fs.createReadStream(this.path, {
        encoding: 'utf8',
        end: headerBytes,
      });
      readStream.on('error', (error): void => {
        reject(error);
      });
      readStream.on('end', (): void => {
        this.read = true;
        resolve();
      });

      readStream.on('data', (chunk): void => {
        let records = parse(chunk, {
          relax_column_count: true, // eslint-disable-line @typescript-eslint/camelcase
          columns: true,
        });

        records = JSON.parse(JSON.stringify(records).toLowerCase());
        if (Array.isArray(records) && records.length >= 1) {
          const row = records[0];
          const keys = Object.keys(row);

          const increment = row.increment;
          const channels = keys.filter(key => key.startsWith('ch'));

          this.header = new models.Header(increment, channels);

          resolve();
        } else {
          reject('Could not parse header');
        }
      });
    });
  }
}
