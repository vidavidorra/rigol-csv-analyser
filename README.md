# Rigol CSV analyser

Analyse CSV output files of Rigol devices (oscilloscopes).

This project shows statistics of the measurements and can polt them in an iteractive HTML graph with measurement functionality.

## Table of contents

- [Badges](#badges)
- [Documentation](#documentation)
  - [Usage](#usage)
  - [Devices](#devices)
- [License](#license)

<a name="badges"></a>

## Badges

| Badge                                                                                                                                                                                                                                    | Description          | Service              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------- |
| <a href="https://github.com/prettier/prettier#readme"><img alt="code style" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>                                                                     | Code style           | Prettier             |
| <a href="https://conventionalcommits.org"><img alt="Conventional Commits: 1.0.0" src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square"></a>                                                       | Commit style         | Conventional Commits |
| <a href="https://github.com/vidavidorra/rigol-csv-analyser/actions"><img alt="GitHub workflow status" src="https://img.shields.io/github/workflow/status/vidavidorra/rigol-csv-analyser/Lint%20commit%20messages?style=flat-square"></a> | Lint commit messages | GitHub Actions       |

<a name="documentation"></a>

## Documentation

<a name="usage"></a>

### Usage

```shell
analyse <csvFile> [options]

Analayse Rigol CSV

Positionals:
  csvFile  CSV file to analyse                                          [string]

Options:
  --help, -h                                                           [boolean]
  --version, -v                                                        [boolean]
  --title, -t    Title of the generated HTML document and chart.
                                 [string] [default: "Oscilloscope measurements"]
  --port, -p     Port to serve the generated chart on.  [number] [default: 8080]
  --serve, -s    Whether the HTML document should be served.
                                                       [boolean] [default: true]
  --units        Unit(s) of the channel(s).                [array] [default: []]
  --names        Name(s) of the channel(s).                [array] [default: []]

Examples:
  analyse test.csv                          Basic usage
  analyse test.csv --unit V A --name 'ADC   Multiple channels with different
  input' Vref                               units and names
  analyse test.csv --serve=false            Calculate the statistics but don't
                                            serve the HTML output
```

<a name="devices"></a>

### Devices

The Rigol devices where this is known to work for and which are tested are listed below.
If you have verified this project to work on a different device, please [let me know][new-issue]. If you would like support for a different device, please submit an [issue][new-issue] with a sample CSV (less than 2M points) or create a pull request.

- Rigol 1000Z series
  - DS1054Z
  - DS1104Z

<a name="license"></a>

## License

This project is licensed under the [GPLv3 license](https://www.gnu.org/licenses/gpl.html).

Copyright © 2019 Jeroen de Bruijn

<details><summary>License details (click to expand).</summary>
<p>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

The full text of the license is available in the [LICENSE](LICENSE.md) file in this repository and [online](https://www.gnu.org/licenses/gpl.html).

</details>

[new-issue]: https://github.com/vidavidorra/rigol-csv-analyser/issues/new
