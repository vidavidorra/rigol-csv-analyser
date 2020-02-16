// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function SetFormattedMathElement(id, value, digits) {
  // eslint-disable-next-line no-undef
  document.getElementById(id).innerText = value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

$.getJSON('{{ dataFile }}', function(data) {
  const start = new Date();
  // eslint-disable-next-line no-undef
  Highcharts.stockChart('chart-container', {
    chart: {
      type: 'line',
      events: {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        load: function() {
          this.setTitle(null, {
            text: `Built chart in ${new Date() - start} ms`,
          });

          this.annotations.forEach(annotation => {
            annotation.setControlPointsVisibility(true);
            annotation.cpVisibility = true;
          });
        },
      },
      zoomType: 'x',
      panKey: 'shift',
      height: '40%',
    },
    title: {
      text: '{{ title }}',
    },
    subtitle: {
      text: 'Built chart in ...',
    },
    legend: {
      enabled: true,
    },
    rangeSelector: {
      buttons: [
        {
          type: 'millisecond',
          count: 100,
          text: '100 ns',
        },
        {
          type: 'millisecond',
          count: 1e3,
          text: '1 μs',
        },
        {
          type: 'millisecond',
          count: 10e3,
          text: '10 μs',
        },
        {
          type: 'millisecond',
          count: 100e3,
          text: '100 μs',
        },
        {
          type: 'millisecond',
          count: 1e6,
          text: '1 ms',
        },
        {
          type: 'millisecond',
          count: 10e6,
          text: '10 ms',
        },
        {
          type: 'millisecond',
          count: 100e6,
          text: '100 ms',
        },
        {
          type: 'millisecond',
          count: 1e9,
          text: '1 s',
        },
        {
          type: 'millisecond',
          count: 10e9,
          text: '10 s',
        },
        {
          type: 'millisecond',
          count: 100e9,
          text: '100 s',
        },
        {
          type: 'all',
          text: 'All',
        },
      ],
      buttonTheme: {
        width: 40,
      },
      inputEnabled: false,
    },
    stockTools: {
      gui: {
        buttons: ['toggleAnnotations', 'separator', 'fullScreen'],
      },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        formatter: function() {
          // console.log(
          //   `min: ${this.axis.min.toFixed(0) /
          //     1000} μs, max: ${this.axis.max.toFixed(0) / 1000} μs, range: ${(
          //     this.axis.max - this.axis.min
          //   ).toFixed(0) / 1000} μs`
          // );
          return `${(this.value / 1000).toLocaleString()} ms`;
        },
      },
    },

    tooltip: {
      split: true,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      formatter: function() {
        const tooltip = [`<b>${(this.x / 1000).toLocaleString()} ms<b>`];

        this.points.forEach(point => {
          tooltip.push(`${point.y} V`);
        });

        return tooltip;
      },
    },
    navigator: {
      height: 100,
      xAxis: {
        labels: {
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          formatter: function() {
            return `${(this.value / 1000).toLocaleString()} ms`;
          },
        },
      },
    },
    annotations: [
      {
        type: 'measure',
        typeOptions: {
          point: {
            x: 0,
            y: 0,
            controlPoint: {
              /* control point options */
            },
          },
          label: {
            enabled: false,
          },
          background: {
            width: 300 + 'px',
            height: 150 + 'px',
          },
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          afterUpdate: function() {
            const xAxis = {
              min: Math.max(Math.floor(this.xAxisMin), 0),
              max: Math.ceil(this.xAxisMax),
            };
            /** Min and max seem to be swapped around in the Highstock `this` object */
            const yAxis = {
              min: this.yAxisMax,
              max: this.yAxisMin,
            };

            const series = this.chart.series.slice(0, -1);
            series.forEach(serie => {
              const serieData = serie.yData
                .slice(xAxis.min, xAxis.max)
                .filter(value => {
                  return value > yAxis.min && value < yAxis.max;
                });

              if (!serieData.length) {
                return;
              }

              /* eslint-disable no-undef */
              const count = serieData.length;
              const duration = math.min(
                (xAxis.max - xAxis.min) * data.increment,
                data.maxDuration
              );
              const sum = math.sum(serieData);
              const mean = math.mean(serieData);
              const min = math.min(serieData);
              const max = math.max(serieData);
              const variance = math.variance(serieData, 'uncorrected');
              const standardDeviation = math.std(serieData, 'uncorrected');
              /* eslint-enable no-undef */

              [
                { id: `${serie.name}Count`, value: count, digits: 0 },
                { id: `${serie.name}Duration`, value: duration, digits: 6 },
                { id: `${serie.name}Sum`, value: sum, digits: 6 },
                { id: `${serie.name}Min`, value: min, digits: 6 },
                { id: `${serie.name}Max`, value: max, digits: 6 },
                { id: `${serie.name}Mean`, value: mean, digits: 6 },
                { id: `${serie.name}Variance`, value: variance, digits: 6 },
                {
                  id: `${serie.name}StandardDeviation`,
                  value: standardDeviation,
                  digits: 6,
                },
              ].forEach(element => {
                SetFormattedMathElement(
                  element.id,
                  element.value,
                  element.digits
                );
              });
            });
          },
        },
      },
    ],
    plotOptions: {
      series: {
        marker: {
          enabledThreshold: 5,
        },
      },
    },
    series: data.series,
  });
});
