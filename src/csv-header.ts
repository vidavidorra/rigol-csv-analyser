import { Header } from './header';
import fs from 'fs';
import parse from 'csv-parse';

export class CsvHeader {
  private csvFile: string;

  public constructor(csvFile: string) {
    this.csvFile = csvFile;
  }

  public Read(): Promise<Header> {
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
      const readStream = fs.createReadStream(this.csvFile, {
        encoding: 'utf8',
        end: headerBytes,
      });

      readStream.on('close', (): void => {
        reject('CSV header could not be parsed.');
      });
      readStream.on('error', (error): void => {
        reject(error);
      });

      const parser = parse({
        relax_column_count: true, // eslint-disable-line @typescript-eslint/camelcase
        columns: true,
      });

      parser.on('data', (chunk): void => {
        const row = JSON.parse(JSON.stringify(chunk).toLowerCase());

        if ('increment' in row) {
          const keys = Object.keys(row);
          const channels = keys.filter(key => key.startsWith('ch'));
          const increment = row.increment;

          readStream.destroy();
          parser.destroy();
          resolve(new Header(increment, channels));
        }
      });
      parser.on('error', error => {
        reject(error);
      });

      readStream.pipe(parser);
    });
  }
}
