// Variables para la triangulación
let points = [];
let triangles = [];
let relaxationSpeed = 0.15;
let showVoronoi = false;
let minDist = 40; // Distancia mínima de Poisson

function setup() {
  createCanvas(windowWidth, windowHeight);
  minDist = min(height/15, width/15)
  textAlign(CENTER);
  textSize(width/75)

  
  // Generar puntos con distribución de Poisson Disk Sampling
  points = poissonDiskSampling(width, height, minDist, 30);
  
  // Calcular triangulación de Delaunay
  triangles = calculateDelaunay(points);
}

function draw() {
  background(20);
  
  // Aplicar relajación de Voronoi (algoritmo de Lloyd)
  lloydRelaxation();
  
  // Recalcular triangulación con las nuevas posiciones
  triangles = calculateDelaunay(points);
  
  if (showVoronoi) {
    drawVoronoi();
    fill(240, 70, );
    noStroke();
  } else {
    drawDelaunay();
    // color para circulos
    fill(0, 30, 240);
    noStroke();
  }
  

  for (let i in points) {
    let p = points[i];
    //circle(p.x, p.y, 4);
    //text(i, p.x, p.y);
  }
  
  fill(255)
  text("Click me", width/2, height/2)
}

function mousePressed() {
  if (mouseButton === CENTER) {
    // Variables para la triangulación
    points = [];
    triangles = [];

      // Generar puntos con distribución de Poisson Disk Sampling
    points = poissonDiskSampling(width, height, minDist, 30);

    // Calcular triangulación de Delaunay
    triangles = calculateDelaunay(points);
  } 
  if (mouseButton === LEFT) {
    showVoronoi = !showVoronoi;
  }
}



function drawDelaunay() {
  // Dibujar triángulos de Delaunay con filtro de distancia
  noFill();
  stroke(100, 150, 255, 80);
  strokeWeight(1);
  
  let maxDist = minDist * 2; // Distancia máxima permitida
  
  for (let tri of triangles) {
    let p0 = points[tri[0]];
    let p1 = points[tri[1]];
    let p2 = points[tri[2]];
    
    let d01 = dist(p0.x, p0.y, p1.x, p1.y);
    let d12 = dist(p1.x, p1.y, p2.x, p2.y);
    let d20 = dist(p2.x, p2.y, p0.x, p0.y);
    
    // Dibujar solo las aristas que no excedan la distancia máxima
    if (d01 <= maxDist) {
      drawOrganicLine(p0.x, p0.y, p1.x, p1.y);
    }
    if (d12 <= maxDist) {
      drawOrganicLine(p1.x, p1.y, p2.x, p2.y);
    }
    if (d20 <= maxDist) {
      drawOrganicLine(p2.x, p2.y, p0.x, p0.y);
    }
  }
}



function  drawOrganicLine(x1, y1, x2, y2) {
    const segments = 3;
    const noiseScale = 0.1;
    
    beginShape();
    vertex(x1, y1);
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = lerp(x1, x2, t);
      const y = lerp(y1, y2, t);
      
      const offset = noise(x * noiseScale, y * noiseScale, /*time* */ 0.05) * 6 - 3;
      const px = x + offset;
      const py = y + offset;
      
      vertex(px, py);
    }
    
    vertex(x2, y2);
    endShape();
}
  



/*
function drawVoronoi() {
  // Dibujar celdas de Voronoi
  stroke(255, 100, 150, 80);
  strokeWeight(1);
  noFill();
  
  for (let i = 0; i < points.length; i++) {
    let voronoiVertices = [];
    
    // Buscar todos los triángulos que contienen este punto
    for (let tri of triangles) {
      if (tri.includes(i)) {
        // Calcular el circuncentro de este triángulo
        let p0 = points[tri[0]];
        let p1 = points[tri[1]];
        let p2 = points[tri[2]];
        
        let circumcenter = getCircumcenter(p0, p1, p2);
        
        if (circumcenter) {
          voronoiVertices.push(circumcenter);
        }
      }
    }
    
    // Ordenar los vértices de Voronoi en sentido antihorario
    if (voronoiVertices.length > 0) {
      let center = points[i];
      voronoiVertices.sort((a, b) => {
        let angleA = atan2(a.y - center.y, a.x - center.x);
        let angleB = atan2(b.y - center.y, b.x - center.x);
        return angleA - angleB;
      });
      
      let colordist = (1-(dist(points[i].x,points[i].y,width/2, height/2))/width*2)*255;
      fill(colordist*abs(sin(millis()/800)),0,0)
      
      // Dibujar el polígono de Voronoi
      beginShape();
      for (let v of voronoiVertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
    }
  }
}
*/

function drawVoronoi() {
  stroke(255, 100, 150, 80);
  strokeWeight(1);
  noFill();

  for (let i = 0; i < points.length; i++) {
    let voronoiVertices = [];

    // Buscar triángulos que contienen este punto
    for (let tri of triangles) {
      if (tri.includes(i)) {
        let p0 = points[tri[0]];
        let p1 = points[tri[1]];
        let p2 = points[tri[2]];
        let circumcenter = getCircumcenter(p0, p1, p2);
        if (circumcenter) {
          voronoiVertices.push(circumcenter);
        }
      }
    }

    // Ordenar en antihorario
    if (voronoiVertices.length > 0) {
      let center = points[i];
      voronoiVertices.sort((a, b) => {
        let angleA = atan2(a.y - center.y, a.x - center.x);
        let angleB = atan2(b.y - center.y, b.x - center.x);
        return angleA - angleB;
      });

      // 🚨 FILTRO: si algún vértice toca los bordes, descartamos la celda
      let touchesBorder = voronoiVertices.some(v =>
        v.x <= 1 || v.x >= width - 1 || v.y <= 1 || v.y >= height - 1
      );
      if (touchesBorder) continue; // saltar esta celda

      // Color dinámico
      let peso = abs(sin(millis()/800))
      let colordist = (1-(dist(points[i].x,points[i].y,width/2, height/2))/width*2)*255;
      strokeWeight(20*(1-peso))
      stroke(20)
      fill(colordist*(peso+.1), 0, 0);

      // Dibujar polígono
      beginShape();
      for (let v of voronoiVertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
    }
  }
}



// Algoritmo de Lloyd (relajación de Voronoi)
function lloydRelaxation() {
  let newPositions = [];
  
  for (let i = 0; i < points.length; i++) {
    // Encontrar todos los vértices de la celda de Voronoi para este punto
    let voronoiVertices = [];
    
    // Buscar todos los triángulos que contienen este punto
    for (let tri of triangles) {
      if (tri.includes(i)) {
        // Calcular el circuncentro de este triángulo
        let p0 = points[tri[0]];
        let p1 = points[tri[1]];
        let p2 = points[tri[2]];
        
        let circumcenter = getCircumcenter(p0, p1, p2);
        
        if (circumcenter && 
            circumcenter.x >= 0 && circumcenter.x <= width &&
            circumcenter.y >= 0 && circumcenter.y <= height) {
          voronoiVertices.push(circumcenter);
        }
      }
    }
    
    // Calcular el centroide de la celda de Voronoi
    if (voronoiVertices.length > 0) {
      let centroidX = 0;
      let centroidY = 0;
      
      for (let v of voronoiVertices) {
        centroidX += v.x;
        centroidY += v.y;
      }
      
      centroidX /= voronoiVertices.length;
      centroidY /= voronoiVertices.length;
      
      // Mover el punto hacia el centroide
      let newX = lerp(points[i].x, centroidX, relaxationSpeed);
      let newY = lerp(points[i].y, centroidY, relaxationSpeed);
      
      // Mantener dentro de los límites
      newX = constrain(newX, 20, width - 20);
      newY = constrain(newY, 20, height - 20);
      
      newPositions.push({x: newX, y: newY});
    } else {
      newPositions.push({x: points[i].x, y: points[i].y});
    }
  }
  
  // Actualizar posiciones
  points = newPositions;
}

// Calcular el circuncentro de un triángulo
function getCircumcenter(a, b, c) {
  let d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  
  if (abs(d) < 0.0001) return null;
  
  let aSq = a.x * a.x + a.y * a.y;
  let bSq = b.x * b.x + b.y * b.y;
  let cSq = c.x * c.x + c.y * c.y;
  
  let x = (aSq * (b.y - c.y) + bSq * (c.y - a.y) + cSq * (a.y - b.y)) / d;
  let y = (aSq * (c.x - b.x) + bSq * (a.x - c.x) + cSq * (b.x - a.x)) / d;
  
  return {x: x, y: y};
}

// Algoritmo de Poisson Disk Sampling
function poissonDiskSampling(w, h, minDist, numAttempts) {
  let cellSize = minDist / sqrt(2);
  let grid = [];
  let active = [];
  let ordered = [];
  
  let cols = floor(w / cellSize);
  let rows = floor(h / cellSize);
  
  for (let i = 0; i < cols * rows; i++) {
    grid[i] = undefined;
  }
  
  let x = random(w);
  let y = random(h);
  let i = floor(x / cellSize);
  let j = floor(y / cellSize);
  let pos = {x: x, y: y};
  grid[i + j * cols] = pos;
  active.push(pos);
  ordered.push(pos);
  
  while (active.length > 0) {
    let randIndex = floor(random(active.length));
    let pos = active[randIndex];
    let found = false;
    
    for (let n = 0; n < numAttempts; n++) {
      let angle = random(TWO_PI);
      let radius = random(minDist, 2 * minDist);
      let newX = pos.x + cos(angle) * radius;
      let newY = pos.y + sin(angle) * radius;
      
      if (newX >= 0 && newX < w && newY >= 0 && newY < h) {
        let col = floor(newX / cellSize);
        let row = floor(newY / cellSize);
        let ok = true;
        
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            let index = (col + i) + (row + j) * cols;
            let neighbor = grid[index];
            if (neighbor) {
              let d = dist(newX, newY, neighbor.x, neighbor.y);
              if (d < minDist) {
                ok = false;
              }
            }
          }
        }
        
        if (ok) {
          found = true;
          let newPos = {x: newX, y: newY};
          grid[col + row * cols] = newPos;
          active.push(newPos);
          ordered.push(newPos);
          break;
        }
      }
    }
    
    if (!found) {
      active.splice(randIndex, 1);
    }
  }
  
  return ordered;
}

// Triangulación de Delaunay usando algoritmo incremental
function calculateDelaunay(pts) {
  if (pts.length < 3) return [];
  
  // Crear super-triángulo
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (let p of pts) {
    minX = min(minX, p.x);
    minY = min(minY, p.y);
    maxX = max(maxX, p.x);
    maxY = max(maxY, p.y);
  }
  
  let dx = maxX - minX;
  let dy = maxY - minY;
  let deltaMax = max(dx, dy);
  let midx = (minX + maxX) / 2;
  let midy = (minY + maxY) / 2;
  
  let p1 = {x: midx - 20 * deltaMax, y: midy - deltaMax};
  let p2 = {x: midx, y: midy + 20 * deltaMax};
  let p3 = {x: midx + 20 * deltaMax, y: midy - deltaMax};
  
  let allPoints = [p1, p2, p3, ...pts];
  let tris = [[0, 1, 2]];
  
  // Agregar puntos uno por uno
  for (let i = 3; i < allPoints.length; i++) {
    let badTriangles = [];
    let polygon = [];
    
    // Encontrar triángulos cuyo circuncírculo contiene el punto
    for (let j = 0; j < tris.length; j++) {
      if (inCircumcircle(allPoints, tris[j], allPoints[i])) {
        badTriangles.push(j);
      }
    }
    
    // Encontrar el polígono del hueco
    for (let j of badTriangles) {
      let tri = tris[j];
      for (let k = 0; k < 3; k++) {
        let edge = [tri[k], tri[(k + 1) % 3]];
        let shared = false;
        
        for (let m of badTriangles) {
          if (m === j) continue;
          let tri2 = tris[m];
          if (sharesEdge(tri, tri2, edge)) {
            shared = true;
            break;
          }
        }
        
        if (!shared) {
          polygon.push(edge);
        }
      }
    }
    
    // Eliminar triángulos malos
    for (let j = badTriangles.length - 1; j >= 0; j--) {
      tris.splice(badTriangles[j], 1);
    }
    
    // Crear nuevos triángulos
    for (let edge of polygon) {
      tris.push([edge[0], edge[1], i]);
    }
  }
  
  // Eliminar triángulos que usan vértices del super-triángulo
  let filtered = [];
  for (let tri of tris) {
    if (tri[0] >= 3 && tri[1] >= 3 && tri[2] >= 3) {
      filtered.push([tri[0] - 3, tri[1] - 3, tri[2] - 3]);
    }
  }
  
  return filtered;
}

function inCircumcircle(points, tri, p) {
  let a = points[tri[0]];
  let b = points[tri[1]];
  let c = points[tri[2]];
  
  let circumcenter = getCircumcenter(a, b, c);
  
  // Si el triángulo es degenerado (puntos colineales)
  if (!circumcenter) return false;
  
  // Comparamos las distancias al cuadrado para evitar la costosa operación de raíz cuadrada
  let radiusSq = (circumcenter.x - a.x) * (circumcenter.x - a.x) + (circumcenter.y - a.y) * (circumcenter.y - a.y);
  let distSq = (circumcenter.x - p.x) * (circumcenter.x - p.x) + (circumcenter.y - p.y) * (circumcenter.y - p.y);
  
  return distSq <= radiusSq;
}

function sharesEdge(tri1, tri2, edge) {
  let count = 0;
  for (let v of tri2) {
    if (v === edge[0] || v === edge[1]) count++;
  }
  return count === 2;
}