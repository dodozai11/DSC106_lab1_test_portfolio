import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let selectedYear = '';
let query = '';

function getFilteredProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  d3.select('svg').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  newArcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;
        selectedYear = selectedIndex === -1 ? '' : newData[idx].label;

        d3.select('svg')
          .selectAll('path')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');

        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, i) => i === selectedIndex ? 'legend-item selected' : 'legend-item');

        let filtered = getFilteredProjects();

        if (selectedIndex === -1) {
          renderProjects(filtered, projectsContainer, 'h2');
        } else {
          let filteredByYear = filtered.filter((p) => p.year === selectedYear);
          renderProjects(filteredByYear, projectsContainer, 'h2');
        }
      });
  });

  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let filtered = getFilteredProjects();
  renderPieChart(filtered);

  if (selectedIndex === -1) {
    renderProjects(filtered, projectsContainer, 'h2');
  } else {
    let filteredByYear = filtered.filter((p) => p.year === selectedYear);
    renderProjects(filteredByYear, projectsContainer, 'h2');
  }
});