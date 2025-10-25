const svgWidth = 900;
const svgHeight = 500;
const margin = { top: 40, right: 20, bottom: 60, left: 60 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Cargar CSV
d3.csv("data/Mental Health dataset.csv").then(data => {

  // Contar ocurrencias de combinaciones Gender x Treatment
  const nested = d3.rollup(
    data,
    v => v.length,
    d => d.Gender,
    d => d.Treatment
  );

  // Preparar datos en formato array
  const genders = Array.from(nested.keys());
  const treatmentSet = new Set();
  nested.forEach(tMap => tMap.forEach((v,k) => treatmentSet.add(k)));
  const treatments = Array.from(treatmentSet);

  const dataset = [];
  nested.forEach((tMap, gender) => {
    let total = d3.sum(Array.from(tMap.values()));
    tMap.forEach((count, treatment) => {
      dataset.push({
        gender,
        treatment,
        count,
        total
      });
    });
  });

  // Escalas
  const xScale = d3.scaleLinear().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);

  // Calcular posiciones Marimekko
  const genderTotals = d3.rollup(dataset, v => d3.sum(v, d => d.count), d => d.gender);
  let xStart = 0;
  const rects = [];
  genders.forEach(g => {
    const genderWidth = (genderTotals.get(g) / d3.sum(Array.from(genderTotals.values()))) * width;
    let yStart = 0;
    treatments.forEach(t => {
      const d = dataset.find(dd => dd.gender === g && dd.treatment === t);
      if(d){
        const rectHeight = (d.count / d.total) * height;
        rects.push({
          x: xStart,
          y: height - yStart - rectHeight,
          width: genderWidth,
          height: rectHeight,
          gender: g,
          treatment: t,
          count: d.count
        });
        yStart += rectHeight;
      }
    });
    xStart += genderWidth;
  });

  // Colores
  const color = d3.scaleOrdinal()
    .domain(treatments)
    .range(d3.schemeCategory10);

  // Dibujar rectángulos
  svg.selectAll("rect")
    .data(rects)
    .enter()
    .append("rect")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("width", d => d.width)
    .attr("height", d => d.height)
    .attr("fill", d => color(d.treatment))
    .attr("stroke", "white");

  // Etiquetas
  svg.selectAll(".rect-label")
    .data(rects)
    .enter()
    .append("text")
    .attr("class", "rect-label")
    .attr("x", d => d.x + d.width / 2)
    .attr("y", d => d.y + d.height / 2)
    .text(d => d.count);

  // Eje X - Gender
  let xPos = 0;
  svg.selectAll(".x-label")
    .data(genders)
    .enter()
    .append("text")
    .attr("x", d => {
      const w = (genderTotals.get(d) / d3.sum(Array.from(genderTotals.values()))) * width;
      const cx = xPos + w / 2;
      xPos += w;
      return cx;
    })
    .attr("y", height + 20)
    .attr("text-anchor", "middle")
    .text(d => d);

  // Leyenda Treatment
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 10},0)`);

  treatments.forEach((t,i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i*20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(t));

    legend.append("text")
      .attr("x", 20)
      .attr("y", i*20 + 12)
      .text(t);
  });

}).catch(err => console.error(err));
