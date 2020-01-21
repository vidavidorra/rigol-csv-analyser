import { RigolCsvAnalyser } from './rigol-csv-analyser';
import yargs from 'yargs';

interface Arguments {
  csvFile: string;
  title: string;
  port: number;
}

class Cli {
  public Run(argv: string[]): void {
    try {
      const args = this.Parse(argv);

      const rsv = new RigolCsvAnalyser(args.csvFile, args.title, args.port);
      rsv.Analyse();
      rsv.Serve();
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  private Parse(argv: string[]): Arguments {
    const args = yargs
      .strict(true)
      .usage(
        '$0 [options] <csvFile>',
        'Analayse Rigol CSV',
        (yargs): yargs.Argv => {
          return yargs.positional('csvFile', {
            describe: 'CSV file to analyse',
            type: 'string',
          });
        }
      )
      .options({
        title: {
          alias: 't',
          describe: 'Title of the generated HTML document and chart.',
          type: 'string',
          default: 'Oscilloscope measurements',
        },
        port: {
          alias: 'p',
          describe: 'Port to serve the generated chart on.',
          type: 'number',
          default: 8080,
        },
        version: {
          alias: 'v',
        },
        help: {
          alias: 'h',
        },
      })
      .parse(argv);

    return {
      csvFile: args.csvFile as string,
      title: args.title as string,
      port: args.port,
    };
  }
}

const cli = new Cli();
cli.Run(process.argv.splice(2));
