import { Options } from './options';
import { RigolCsvAnalyser } from './rigol-csv-analyser';
import yargs from 'yargs';

class Cli {
  public async Run(argv: string[]): Promise<void> {
    try {
      const options = this.Parse(argv);

      const rsv = new RigolCsvAnalyser(options);
      await rsv.Analyse();
      if (options.serve) {
        rsv.Serve();
      }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  private Parse(argv: string[]): Options {
    const args = yargs
      .strict(true)
      .scriptName('analyse')
      .usage(
        '$0 <csvFile> [options]',
        'Analayse Rigol CSV',
        (yargs): yargs.Argv => {
          return yargs
            .positional('csvFile', {
              describe: 'CSV file to analyse',
              type: 'string',
            })
            .example('$0 test.csv', 'Basic usage')
            .example(
              "$0 test.csv --unit V A --name 'ADC input' Vref",
              'Multiple channels with different units and names'
            )
            .example(
              '$0 test.csv --serve=false',
              "Calculate the statistics but don't serve the HTML output"
            );
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
        serve: {
          alias: 's',
          describe: 'Whether the HTML document should be served.',
          type: 'boolean',
          default: true,
        },
        units: {
          describe: 'Unit(s) of the channel(s).',
          type: 'array',
          default: [],
        },
        names: {
          describe: 'Name(s) of the channel(s).',
          type: 'array',
          default: [],
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
      serve: args.serve,
      channelNames: args.names,
      channelUnits: args.units,
    };
  }
}

const cli = new Cli();
cli.Run(process.argv.splice(2));
