class Nodo {
    constructor(punto, izquierda = null, derecha = null) {
        this.punto = punto;
        this.izquierda = izquierda;
        this.derecha = derecha;
    }
}

function construirKDTree(puntos, profundidad = 0) {
    if (puntos.length === 0) {
        return null;
    }

    const k = puntos[0].length;
    const eje = profundidad % k;

    puntos.sort((a, b) => a[eje] - b[eje]);
    const mediana = Math.floor(puntos.length / 2);

    return new Nodo(
        puntos[mediana],
        construirKDTree(puntos.slice(0, mediana), profundidad + 1),
        construirKDTree(puntos.slice(mediana + 1), profundidad + 1)
    );
}

function buscarPuntoMasCercano(nodo, puntoConsulta, profundidad = 0, mejor = null) {
    if (nodo === null) {
        return mejor;
    }

    const k = puntoConsulta.length;
    const eje = profundidad % k;

    let mejorActual = mejor;
    let distanciaActual = mejor ? distancia(puntoConsulta, mejor) : Infinity;

    const distanciaNodo = distancia(puntoConsulta, nodo.punto);
    if (distanciaNodo < distanciaActual) {
        mejorActual = nodo.punto;
        distanciaActual = distanciaNodo;
    }

    const irIzquierda = puntoConsulta[eje] < nodo.punto[eje];

    const primerNodo = irIzquierda ? nodo.izquierda : nodo.derecha;
    const segundoNodo = irIzquierda ? nodo.derecha : nodo.izquierda;

    mejorActual = buscarPuntoMasCercano(primerNodo, puntoConsulta, profundidad + 1, mejorActual);

    if (Math.abs(puntoConsulta[eje] - nodo.punto[eje]) < distanciaActual) {
        mejorActual = buscarPuntoMasCercano(segundoNodo, puntoConsulta, profundidad + 1, mejorActual);
    }

    return mejorActual;
}

function buscarKPuntosMasCercanos(nodo, puntoConsulta, k, profundidad = 0, mejores = []) {
    if (nodo === null) {
        return mejores;
    }

    const kDim = puntoConsulta.length;
    const eje = profundidad % kDim;

    const distanciaNodo = distancia(puntoConsulta, nodo.punto);
    if (mejores.length < k || distanciaNodo < distancia(puntoConsulta, mejores[mejores.length - 1])) {
        mejores.push(nodo.punto);
        mejores.sort((a, b) => distancia(puntoConsulta, a) - distancia(puntoConsulta, b));
        if (mejores.length > k) {
            mejores.pop();
        }
    }

    const irIzquierda = puntoConsulta[eje] < nodo.punto[eje];

    const primerNodo = irIzquierda ? nodo.izquierda : nodo.derecha;
    const segundoNodo = irIzquierda ? nodo.derecha : nodo.izquierda;

    mejores = buscarKPuntosMasCercanos(primerNodo, puntoConsulta, k, profundidad + 1, mejores);

    if (mejores.length < k || Math.abs(puntoConsulta[eje] - nodo.punto[eje]) < distancia(puntoConsulta, mejores[mejores.length - 1])) {
        mejores = buscarKPuntosMasCercanos(segundoNodo, puntoConsulta, k, profundidad + 1, mejores);
    }

    return mejores;
}

function distancia(p1, p2) {
    return Math.sqrt(p1.reduce((sum, val, idx) => sum + Math.pow(val - p2[idx], 2), 0));
}

function generarPuntos(n) {
    const puntos = [];
    for (let i = 0; i < n; i++) {
        puntos.push([Math.random(), Math.random()]);
    }
    return puntos;
}

let puntos = generarPuntos(100);
let kdTree = construirKDTree(puntos);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const kInput = document.getElementById('k-input');
let puntoConsulta = null;

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvas.width;
    const y = (event.clientY - rect.top) / canvas.height;
    puntoConsulta = [x, y];
    actualizarGrafico();
});

kInput.addEventListener('change', actualizarGrafico);

function actualizarGrafico() {
    if (puntoConsulta === null) return;

    const k = parseInt(kInput.value);
    const puntoCercano = buscarPuntoMasCercano(kdTree, puntoConsulta);
    const puntosCercanos = buscarKPuntosMasCercanos(kdTree, puntoConsulta, k);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    puntos.forEach(punto => {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(punto[0] * canvas.width, punto[1] * canvas.height, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(puntoConsulta[0] * canvas.width, puntoConsulta[1] * canvas.height, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(puntoCercano[0] * canvas.width, puntoCercano[1] * canvas.height, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    puntosCercanos.forEach(punto => {
        if (punto !== puntoCercano) {
            ctx.beginPath();
            ctx.arc(punto[0] * canvas.width, punto[1] * canvas.height, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    const distanciasCercanos = puntosCercanos.map(p => distancia(puntoConsulta, p));
    const radioCirculo = distanciasCercanos[distanciasCercanos.length - 1] * canvas.width;
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.arc(puntoConsulta[0] * canvas.width, puntoConsulta[1] * canvas.height, radioCirculo, 0, Math.PI * 2);
    ctx.stroke();
}

actualizarGrafico();
