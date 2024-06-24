class KDNode {
    constructor(point, axis, left = null, right = null) {
        this.point = point;
        this.axis = axis;
        this.left = left;
        this.right = right;
    }
}

function buildKDTree(points, depth = 0) {
    if (points.length === 0) {
        return null;
    }

    const axis = depth % 2;
    points.sort((a, b) => a[axis] - b[axis]);
    const medianIndex = Math.floor(points.length / 2);
    const medianPoint = points[medianIndex];

    return new KDNode(
        medianPoint,
        axis,
        buildKDTree(points.slice(0, medianIndex), depth + 1),
        buildKDTree(points.slice(medianIndex + 1), depth + 1)
    );
}

function distanceSquared(point1, point2) {
    return (point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2;
}

function nearestNeighbor(node, target, depth = 0, best = null) {
    if (node === null) {
        return best;
    }

    const axis = depth % 2;
    const nextBest = best === null || distanceSquared(target, node.point) < distanceSquared(target, best.point) ? node : best;
    const nextDepth = depth + 1;

    let nextNode = null;
    let oppositeNode = null;
    if (target[axis] < node.point[axis]) {
        nextNode = node.left;
        oppositeNode = node.right;
    } else {
        nextNode = node.right;
        oppositeNode = node.left;
    }

    best = nearestNeighbor(nextNode, target, nextDepth, nextBest);

    if (distanceSquared(target, best.point) > (target[axis] - node.point[axis]) ** 2) {
        best = nearestNeighbor(oppositeNode, target, nextDepth, best);
    }

    return best;
}

function kNearestNeighbors(node, target, k, depth = 0, heap = []) {
    if (node === null) {
        return heap;
    }

    const axis = depth % 2;
    const distance = distanceSquared(target, node.point);
    if (heap.length < k) {
        heap.push({ node: node, distance: distance });
        heap.sort((a, b) => a.distance - b.distance);
    } else if (distance < heap[heap.length - 1].distance) {
        heap[heap.length - 1] = { node: node, distance: distance };
        heap.sort((a, b) => a.distance - b.distance);
    }

    const nextNode = target[axis] < node.point[axis] ? node.left : node.right;
    const oppositeNode = target[axis] < node.point[axis] ? node.right : node.left;
    heap = kNearestNeighbors(nextNode, target, k, depth + 1, heap);

    if (heap.length < k || Math.abs(target[axis] - node.point[axis]) ** 2 < heap[heap.length - 1].distance) {
        heap = kNearestNeighbors(oppositeNode, target, k, depth + 1, heap);
    }

    return heap;
}

const points = [
    [-70.0333, -15.8422], 
    [-70.0333, -15.8483],
    [-70.0234, -15.8452],
    [-70.0235, -15.8305],
    [-70.0236, -15.8365],
    [-70.0237, -15.8625],
    [-70.0256, -15.8600], 
    [-70.0238, -15.8398]
];

const kdTree = buildKDTree(points);

const map = L.map('map').setView([-15.8402, -70.0333], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markers = [];
points.forEach(point => {
    const marker = L.circleMarker([point[1], point[0]], {
        color: 'blue',
        radius: 5
    }).addTo(map);
    markers.push(marker);
});

let queryPointMarker = null;

map.on('click', (event) => {
    const k = parseInt(document.getElementById('k-input').value);
    const queryPoint = [event.latlng.lng, event.latlng.lat];

    if (queryPointMarker) {
        map.removeLayer(queryPointMarker);
    }

    queryPointMarker = L.circleMarker([queryPoint[1], queryPoint[0]], {
        color: 'red',
        radius: 5
    }).addTo(map);

    const nearest = nearestNeighbor(kdTree, queryPoint);
    const nearestNeighbors = kNearestNeighbors(kdTree, queryPoint, k);

    markers.forEach(marker => {
        marker.setStyle({ color: 'blue' });
    });

    nearestNeighbors.forEach((neighbor, index) => {
        const color = index === 0 ? 'green' : 'black';
        markers[points.indexOf(neighbor.node.point)].setStyle({ color });
    });

    if (nearestNeighbors.length > 0) {
        const radius = Math.sqrt(nearestNeighbors[nearestNeighbors.length - 1].distance);
        L.circle([queryPoint[1], queryPoint[0]], {
            color: 'blue',
            radius: radius * 111000 // Convertir distancia en grados a metros aproximadamente
        }).addTo(map);
    }
});
