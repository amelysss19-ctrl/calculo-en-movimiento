import {
    FilesetResolver,
    HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";

/* =====================================================
   ELEMENTOS DE LA INTERFAZ
===================================================== */

const botonCamara = document.getElementById("botonCamara");
const botonReiniciar = document.getElementById("reiniciar");
const camara = document.getElementById("camara");
const lienzo = document.getElementById("lienzo");
const ctx = lienzo ? lienzo.getContext("2d") : null;

const estadoDerecha = document.getElementById("estadoDerecha");
const dedosDerecha = document.getElementById("dedosDerecha");
const estadoIzquierda = document.getElementById("estadoIzquierda");
const gesto = document.getElementById("gesto");
const accion = document.getElementById("accion");
const resultado = document.getElementById("resultado");

const canvasGrafica = document.getElementById("grafica");
const botonAlejarGrafica = document.getElementById("alejarGrafica");
const botonAcercarGrafica = document.getElementById("acercarGrafica");
const botonRestablecerVistaGrafica = document.getElementById("restablecerVistaGrafica");
const canvasSuperficie3D = document.getElementById("superficie3D");
const entradaFuncion = document.getElementById("entradaFuncion");
const botonAplicar = document.getElementById("aplicarFuncion");
const funcionActiva = document.getElementById("funcionActiva");
const dominio = document.getElementById("dominio");
const evaluacionPunto = document.getElementById("evaluacionPunto");
const valorEvaluacionX = document.getElementById("valorEvaluacionX");
const estadoFuncion = document.getElementById("estadoFuncion");
const modalAdvertencia = document.getElementById("modalAdvertencia");
const tituloAdvertencia = document.getElementById("tituloAdvertencia");
const mensajeAdvertencia = document.getElementById("mensajeAdvertencia");
const botonSimbolos = document.getElementById("botonSimbolos");
const panelSimbolos = document.getElementById("panelSimbolos");
const panelIngresoLog = document.getElementById("panelIngresoLog");
const opcionesIngresoLog = document.getElementById("opcionesIngresoLog");
const formularioBaseLog = document.getElementById("formularioBaseLog");
const baseLog = document.getElementById("baseLog");
const errorBaseLog = document.getElementById("errorBaseLog");
const controlesManuales = document.getElementById("controlesManuales");
const botonPausarControlManual = document.getElementById("pausarControlManual");


/* =====================================================
   VARIABLES GENERALES
===================================================== */

let handLandmarker = null;
let camaraActiva = false;
let modalidadControl = "gestos";
let interaccionManualPausada = false;
let cantidadDedosDerechaActual = 0;
let framesSinManoDerecha = 0;
let ultimaDeteccionManos = 0;

const framesToleranciaPerdidaDerecha = 6;
const intervaloDeteccionManos = 1000 / 30;

let funcionActual = null;
let funcionTextoActual = "";

let THREE = null;
let escenaSuperficie3D = null;
let camaraSuperficie3D = null;
let renderizadorSuperficie3D = null;
let mallaSuperficie3D = null;
let lineasSuperficie3D = null;

let historialDedosDerecha = [];

const cantidadMuestras = 8;
const minimoCoincidencias = 6;

let dedosDerechaEstables = null;
let puntoDerechaVisible = false;
let tangenteDerechaVisible = false;
let derivadaDerechaVisible = false;
let puntoCriticoDerechaVisible = false;
let retoAplicadoDerechaVisible = false;
let arbolDerivadaActual = null;
let arbolSegundaDerivadaActual = null;
let funcionDerivadaActual = null;
let funcionSegundaDerivadaActual = null;
let puntosCriticosActuales = [];
let errorPuntosCriticosActuales = "";
let ultimoGestoDerechaProcesado = null;
let ultimaFuncionDerechaProcesada = null;
let firmaPanelInteraccion = null;
let firmaGraficaSolicitada = null;
let posicionPuntoDerechaX = null;
let ultimaPosicionPuntoPx = null;
let inicioEstabilidadPunto = null;
let puntoDerechaSeleccionado = false;
let posicionPuntoSeleccionadoX = null;
let posicionRetoAplicadoX = null;
let ultimaPosicionRetoPx = null;
let inicioEstabilidadReto = null;
let retoAplicadoSeleccionado = false;
let posicionRetoCandidataX = null;
let lienzoBaseGrafica = null;
let firmaBaseGrafica = null;

const suavizadoPuntoDerecha = 0.25;


/* =====================================================
   CONTROL MANO IZQUIERDA
===================================================== */

let rotacionX = 0;
let rotacionY = 0;

let rotacionXObjetivo = 0;
let rotacionYObjetivo = 0;

const sensibilidadRotacionX = 3.5;
const sensibilidadRotacionY = 5;


/* =====================================================
    CONTROL DE ZOOM DE LA GRÁFICA
===================================================== */

let escalaGrafica = 1;
let escalaGraficaObjetivo = 1;

const escalaMinima = 0.7;
const escalaMaxima = 1.8;
const rangoInicialEjeX = 10;
const rangoInicialEjeY = 5;
let rangoEjeX = rangoInicialEjeX;
let rangoEjeY = rangoInicialEjeY;
let intervaloEjeComunActual = 1;
let centroVistaX = 0;
let centroVistaY = 0;
let animacionZoomManualEnCurso = false;
let arrastreVistaGrafica = null;
const escalaMinimaZoomManual = 0.0005;


/* =====================================================
   ZOOM CON PINZA
===================================================== */

const distanciaPinzaEntrada = 0.075;
const distanciaPinzaSalida = 0.12;

const minimoDedosRecogidosParaZoom = 2;

let modoZoomIzquierda = false;

let contadorEntradaZoom = 0;
let contadorSalidaZoom = 0;

const framesParaEntrarZoom = 4;
const framesParaSalirZoom = 4;

const distanciaZoomMinima = 0.04;
const distanciaZoomMaxima = 0.18;


/* =====================================================
   TOKENIZADOR Y PARSER MATEMÁTICO
===================================================== */

const funcionesMatematicas = {
    sqrt: valor => Math.sqrt(valor),
    sin: valor => Math.sin(valor),
    cos: valor => Math.cos(valor),
    tan: valor => Math.tan(valor),
    csc: valor => 1 / Math.sin(valor),
    sec: valor => 1 / Math.cos(valor),
    cot: valor => Math.cos(valor) / Math.sin(valor),
    ln: valor => Math.log(valor),
    log: valor => Math.log10(valor)
};

function expandirLogaritmosConBase(texto) {
    const subindices = {
        "₀": "0",
        "₁": "1",
        "₂": "2",
        "₃": "3",
        "₄": "4",
        "₅": "5",
        "₆": "6",
        "₇": "7",
        "₈": "8",
        "₉": "9"
    };
    const expresion = String(texto).toLowerCase();
    let resultado = "";
    let posicion = 0;

    while (posicion < expresion.length) {
        if (!expresion.startsWith("log", posicion)) {
            resultado += expresion[posicion++];
            continue;
        }

        let cursor = posicion + 3;
        let baseTexto = "";

        if (expresion[cursor] === "₍") {
            const finSubindice = expresion.indexOf("₎", cursor + 1);
            if (finSubindice !== -1) {
                baseTexto = expresion.slice(cursor + 1, finSubindice);
                cursor = finSubindice + 1;
            }
        } else {
            while (subindices[expresion[cursor]] !== undefined) {
                baseTexto += subindices[expresion[cursor]];
                cursor++;
            }
        }

        if (!baseTexto) {
            resultado += expresion[posicion++];
            continue;
        }

        while (/\s/.test(expresion[cursor] || "")) {
            cursor++;
        }

        if (expresion[cursor] !== "(") {
            resultado += expresion.slice(posicion, cursor);
            posicion = cursor;
            continue;
        }

        if (
            !/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(baseTexto)
        ) {
            throw new Error("La base del logaritmo debe ser un número válido.");
        }

        const base = Number(baseTexto);
        if (!Number.isFinite(base) || base <= 0 || base === 1) {
            throw new Error(
                "La base del logaritmo debe ser positiva y distinta de 1."
            );
        }

        let profundidad = 0;
        let finArgumento = -1;
        for (let indice = cursor; indice < expresion.length; indice++) {
            if (expresion[indice] === "(") {
                profundidad++;
            } else if (expresion[indice] === ")") {
                profundidad--;
                if (profundidad === 0) {
                    finArgumento = indice;
                    break;
                }
            }
        }

        if (finArgumento === -1) {
            throw new Error("Falta cerrar el argumento del logaritmo.");
        }

        const argumento = expandirLogaritmosConBase(
            expresion.slice(cursor + 1, finArgumento)
        );
        resultado += `(ln(${argumento})/ln(${baseTexto}))`;
        posicion = finArgumento + 1;
    }

    return resultado;
}

function tokenizarExpresion(texto) {

    const tokens = [];
    const expresion = expandirLogaritmosConBase(texto)
        .trim()
        .toLowerCase()
        .replace(/π/g, "pi");
    let posicion = 0;

    while (posicion < expresion.length) {

        const caracter = expresion[posicion];

        if (/\s/.test(caracter)) {
            posicion++;
            continue;
        }

        const numero = expresion.slice(posicion).match(
            /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/
        );

        if (numero) {
            tokens.push({
                tipo: "numero",
                valor: Number(numero[0])
            });
            posicion += numero[0].length;
            continue;
        }

        const nombresPermitidos = [
            "sqrt",
            "csc",
            "sec",
            "cot",
            "sin",
            "cos",
            "tan",
            "log",
            "ln",
            "pi",
            "x",
            "y",
            "e"
        ];

        const nombre = nombresPermitidos
            .sort((a, b) => b.length - a.length)
            .find(candidato =>
                expresion.startsWith(candidato, posicion)
            );

        if (nombre) {

            tokens.push({
                tipo: "identificador",
                valor: nombre
            });
            posicion += nombre.length;
            continue;
        }

        if (/[a-z]/.test(caracter)) {
            throw new Error(`Identificador no permitido: ${caracter}`);
        }

        if ("+-*/^(),".includes(caracter)) {
            tokens.push({
                tipo: caracter,
                valor: caracter
            });
            posicion++;
            continue;
        }

        throw new Error(`Símbolo no permitido: ${caracter}`);
    }

    tokens.push({
        tipo: "fin",
        valor: null
    });

    return tokens;
}

function puedeIniciarFactor(token) {

    return (
        token.tipo === "numero" ||
        token.tipo === "identificador" ||
        token.tipo === "("
    );
}

function parsearExpresion(texto) {

    const tokens = tokenizarExpresion(texto);
    let posicion = 0;

    function actual() {
        return tokens[posicion];
    }

    function aceptar(tipo) {

        if (actual().tipo !== tipo) {
            return false;
        }

        posicion++;
        return true;
    }

    function exigir(tipo) {

        if (!aceptar(tipo)) {
            throw new Error(`Se esperaba '${tipo}'`);
        }
    }

    function analizarSuma() {

        let nodo = analizarProducto();

        while (
            actual().tipo === "+" ||
            actual().tipo === "-"
        ) {
            const operador = actual().tipo;
            posicion++;

            nodo = {
                tipo: "binario",
                operador,
                izquierdo: nodo,
                derecho: analizarProducto()
            };
        }

        return nodo;
    }

    function analizarProducto() {

        let nodo = analizarPotencia();

        while (true) {

            if (
                actual().tipo === "*" ||
                actual().tipo === "/"
            ) {
                const operador = actual().tipo;
                posicion++;

                nodo = {
                    tipo: "binario",
                    operador,
                    izquierdo: nodo,
                    derecho: analizarPotencia()
                };

                continue;
            }

            if (puedeIniciarFactor(actual())) {

                nodo = {
                    tipo: "binario",
                    operador: "*",
                    izquierdo: nodo,
                    derecho: analizarPotencia()
                };

                continue;
            }

            break;
        }

        return nodo;
    }

    function analizarPotencia() {

        const nodo = analizarUnario();

        if (aceptar("^")) {
            return {
                tipo: "binario",
                operador: "^",
                izquierdo: nodo,
                derecho: analizarPotencia()
            };
        }

        return nodo;
    }

    function analizarUnario() {

        if (
            aceptar("+") ||
            aceptar("-")
        ) {
            const operador = tokens[posicion - 1].tipo;

            return {
                tipo: "unario",
                operador,
                argumento: analizarUnario()
            };
        }

        return analizarPrimario();
    }

    function analizarPrimario() {

        const token = actual();

        if (token.tipo === "numero") {
            posicion++;
            return {
                tipo: "numero",
                valor: token.valor
            };
        }

        if (token.tipo === "identificador") {
            posicion++;

            if (funcionesMatematicas[token.valor]) {
                exigir("(");
                const argumento = analizarSuma();
                exigir(")");

                return {
                    tipo: "funcion",
                    nombre: token.valor,
                    argumento
                };
            }

            return {
                tipo: "constante",
                nombre: token.valor
            };
        }

        if (aceptar("(")) {
            const nodo = analizarSuma();
            exigir(")");
            return nodo;
        }

        throw new Error("Se esperaba un número, variable o paréntesis");
    }

    const arbol = analizarSuma();

    if (actual().tipo !== "fin") {
        throw new Error("La expresión contiene tokens inesperados");
    }

    return arbol;
}

function evaluarArbolMatematico(nodo, x, y) {

    switch (nodo.tipo) {

        case "numero":
            return nodo.valor;

        case "constante":
            if (nodo.nombre === "x") {
                return x;
            }

            if (nodo.nombre === "y") {
                return y;
            }

            if (nodo.nombre === "pi") {
                return Math.PI;
            }

            return Math.E;

        case "unario":
            return nodo.operador === "-"
                ? -evaluarArbolMatematico(nodo.argumento, x, y)
                : evaluarArbolMatematico(nodo.argumento, x, y);

        case "funcion":
            return funcionesMatematicas[nodo.nombre](
                evaluarArbolMatematico(nodo.argumento, x, y)
            );

        case "binario": {
            const izquierdo =
                evaluarArbolMatematico(nodo.izquierdo, x, y);
            const derecho =
                evaluarArbolMatematico(nodo.derecho, x, y);

            if (nodo.operador === "+") {
                return izquierdo + derecho;
            }

            if (nodo.operador === "-") {
                return izquierdo - derecho;
            }

            if (nodo.operador === "*") {
                return izquierdo * derecho;
            }

            if (nodo.operador === "/") {
                return izquierdo / derecho;
            }

            return izquierdo ** derecho;
        }

        default:
            throw new Error("Nodo matemático desconocido");
    }
}

function crearFuncionEvaluable(arbol) {

    return function (x, y) {
        return evaluarArbolMatematico(arbol, x, y);
    };
}

function obtenerVariablesDelArbol(nodo) {

    const variables = new Set();

    function recorrer(nodoActual) {

        if (
            nodoActual.tipo === "constante" &&
            (
                nodoActual.nombre === "x" ||
                nodoActual.nombre === "y"
            )
        ) {
            variables.add(nodoActual.nombre);
            return;
        }

        if (nodoActual.tipo === "unario") {
            recorrer(nodoActual.argumento);
            return;
        }

        if (nodoActual.tipo === "funcion") {
            recorrer(nodoActual.argumento);
            return;
        }

        if (nodoActual.tipo === "binario") {
            recorrer(nodoActual.izquierdo);
            recorrer(nodoActual.derecho);
        }
    }

    recorrer(nodo);

    return [
        ...(variables.has("x") ? ["x"] : []),
        ...(variables.has("y") ? ["y"] : [])
    ];
}

/* =====================================================
   PREPARAR FUNCIÓN PARA CÁLCULOS
===================================================== */

function prepararFuncion(texto) {

    try {
        const arbol = parsearExpresion(texto);
        const funcion = crearFuncionEvaluable(arbol);
        funcion.variables = obtenerVariablesDelArbol(arbol);
        const prueba = funcion(1, 1);

        if (
            typeof prueba !== "number"
        ) {
            return null;
        }

        return funcion;

    } catch (error) {

        console.error(
            "Error preparando función:",
            error
        );

        return null;
    }
}


function obtenerPrioridadNodo(nodo) {

    if (nodo.tipo === "binario") {
        if (nodo.operador === "+" || nodo.operador === "-") {
            return 1;
        }

        if (nodo.operador === "*" || nodo.operador === "/") {
            return 2;
        }

        return 3;
    }

    if (nodo.tipo === "unario") {
        return 4;
    }

    return 5;
}

function crearNodoTexto(texto, clase = "") {

    const nodo = document.createElement("span");

    if (clase) {
        nodo.className = clase;
    }

    nodo.textContent = texto;
    return nodo;
}

function formatearNumeroMatematico(valor) {

    if (Object.is(valor, -0) || Math.abs(valor) < 1e-12) {
        return "0";
    }

    const magnitud = Number.isInteger(valor)
        ? Math.abs(valor)
        : Math.abs(Number(valor.toPrecision(10)));

    return (valor < 0 ? "−" : "") + String(magnitud);
}

function esNodoNumeroNegativo(nodo) {
    return nodo.tipo === "numero" && nodo.valor < 0;
}

function esNodoLogaritmoDiez(nodo) {
    return nodo.tipo === "numero" && nodo.valor === Math.LN10;
}

function esCoeficienteNumerico(nodo) {

    if (nodo.tipo === "numero") {
        return !esNodoLogaritmoDiez(nodo);
    }

    return (
        nodo.tipo === "unario" &&
        nodo.argumento.tipo === "numero" &&
        !esNodoLogaritmoDiez(nodo.argumento)
    );
}

function contieneFraccion(nodo) {

    if (nodo.tipo === "binario") {
        if (nodo.operador === "/") {
            return true;
        }

        if (nodo.operador === "^") {
            return contieneFraccion(nodo.izquierdo);
        }

        return (
            contieneFraccion(nodo.izquierdo) ||
            contieneFraccion(nodo.derecho)
        );
    }

    if (nodo.tipo === "unario" || nodo.tipo === "funcion") {
        return contieneFraccion(nodo.argumento);
    }

    return false;
}

function necesitaParentesis(nodo, prioridadPadre, protegerSigno = false) {

    const empiezaConSigno =
        nodo.tipo === "unario" ||
        esNodoNumeroNegativo(nodo);

    return (
        obtenerPrioridadNodo(nodo) < prioridadPadre ||
        (protegerSigno && empiezaConSigno)
    );
}

function necesitaParentesisBase(nodo) {

    // La base de una potencia va entre paréntesis si no es un
    // número, una variable o una función: (x + 1)², (−x)², (√x)²
    return (
        necesitaParentesis(nodo, 4, true) ||
        (nodo.tipo === "funcion" && nodo.nombre === "sqrt")
    );
}

function esBaseConNombreDeFuncion(nodo) {
    return nodo.tipo === "funcion" && nodo.nombre !== "sqrt";
}

function crearParentesis(texto, alto = false) {
    return crearNodoTexto(
        texto,
        alto ? "math-paren math-paren-alto" : "math-paren"
    );
}

function envolverConParentesis(nodo) {

    const alto = contieneFraccion(nodo);
    const grupo = document.createElement("span");
    grupo.className = "math-group";

    grupo.append(
        crearParentesis("(", alto),
        renderizarNodoMatematico(nodo),
        crearParentesis(")", alto)
    );

    return grupo;
}

function crearGrupoMatematico(nodo, prioridadPadre = 0, protegerSigno = false) {

    if (necesitaParentesis(nodo, prioridadPadre, protegerSigno)) {
        return envolverConParentesis(nodo);
    }

    return renderizarNodoMatematico(nodo);
}

function obtenerInicioVisual(nodo) {

    // Indica con qué empieza una expresión al dibujarla.
    // Sirve para decidir si una multiplicación se escribe
    // "2x" (sin símbolo) o "2 · 3" (con punto).

    if (nodo.tipo === "numero") {
        if (esNodoLogaritmoDiez(nodo)) {
            return "funcion";
        }

        return nodo.valor < 0 ? "signo" : "numero";
    }

    if (nodo.tipo === "constante") {
        return "letra";
    }

    if (nodo.tipo === "unario") {
        return "signo";
    }

    if (nodo.tipo === "funcion") {
        return nodo.nombre === "sqrt" ? "raiz" : "funcion";
    }

    if (nodo.operador === "/") {
        return "fraccion";
    }

    if (nodo.operador === "^") {
        if (esBaseConNombreDeFuncion(nodo.izquierdo)) {
            return "funcion";
        }

        return necesitaParentesisBase(nodo.izquierdo)
            ? "parentesis"
            : obtenerInicioVisual(nodo.izquierdo);
    }

    if (nodo.operador === "*") {
        return necesitaParentesis(nodo.izquierdo, 2)
            ? "parentesis"
            : obtenerInicioVisual(nodo.izquierdo);
    }

    return obtenerInicioVisual(nodo.izquierdo);
}

function obtenerFinVisual(nodo) {

    // Indica con qué termina una expresión al dibujarla
    if (nodo.tipo === "numero") {
        return esNodoLogaritmoDiez(nodo) ? "funcion" : "numero";
    }

    if (nodo.tipo === "constante") {
        return "letra";
    }

    if (nodo.tipo === "unario") {
        return obtenerFinVisual(nodo.argumento);
    }

    if (nodo.tipo === "funcion") {
        return nodo.nombre === "sqrt" ? "raiz" : "funcion";
    }

    if (nodo.operador === "^") {
        return "exponente";
    }

    if (nodo.operador === "/") {
        return "fraccion";
    }

    if (nodo.operador === "*") {
        return necesitaParentesis(nodo.derecho, 2, true)
            ? "parentesis"
            : obtenerFinVisual(nodo.derecho);
    }

    return "parentesis";
}

function crearOperadorProducto(izquierdo, derecho, derechoConParentesis) {

    const inicioDerecho = derechoConParentesis
        ? "parentesis"
        : obtenerInicioVisual(derecho);

    if (esCoeficienteNumerico(izquierdo)) {

        // 2x · 3x² · 2√x · 4(x + 1)
        if (["letra", "raiz", "parentesis"].includes(inicioDerecho)) {
            return null;
        }

        // 3 sin(x): solo un pequeño espacio
        if (inicioDerecho === "funcion") {
            return crearNodoTexto("", "math-space");
        }
    }

    // x√x · x²(x + 1) · (x + 1)√(x + 1)
    const finIzquierdo = necesitaParentesis(izquierdo, 2)
        ? "parentesis"
        : obtenerFinVisual(izquierdo);

    if (
        ["raiz", "parentesis"].includes(inicioDerecho) &&
        ["letra", "exponente", "parentesis"].includes(finIzquierdo)
    ) {
        return null;
    }

    // En los demás casos: x · sin(x), 2 · 3
    return crearNodoTexto("·", "math-dot");
}

const espacioNombresSvg = "http://www.w3.org/2000/svg";

function crearRaizCuadrada(argumento) {

    // √ dibujado con SVG: se estira a la altura del contenido
    // y su línea superior cubre todo el radicando.

    const raiz = document.createElement("span");
    raiz.className = "math-sqrt";

    const simbolo = document.createElementNS(espacioNombresSvg, "svg");
    simbolo.setAttribute("class", "math-root-symbol");
    simbolo.setAttribute("viewBox", "0 0 12 24");
    simbolo.setAttribute("preserveAspectRatio", "none");
    simbolo.setAttribute("aria-hidden", "true");

    const trazo = document.createElementNS(espacioNombresSvg, "path");
    trazo.setAttribute("d", "M0.6 14.2 L3.2 12.6 L6.6 23 L11.3 1 L12 1");
    simbolo.appendChild(trazo);

    const radicando = document.createElement("span");
    radicando.className = "math-radicand";
    radicando.appendChild(renderizarNodoMatematico(argumento));

    raiz.append(simbolo, radicando);
    return raiz;
}

function crearArgumentoFuncion(argumento) {

    const alto = contieneFraccion(argumento);

    return [
        crearParentesis("(", alto),
        renderizarNodoMatematico(argumento),
        crearParentesis(")", alto)
    ];
}

function renderizarNodoMatematico(nodo) {

    if (nodo.tipo === "numero") {
        if (esNodoLogaritmoDiez(nodo)) {
            return renderizarNodoMatematico({
                tipo: "funcion",
                nombre: "ln",
                argumento: crearNodoNumero(10)
            });
        }

        return crearNodoTexto(
            formatearNumeroMatematico(nodo.valor),
            "math-number"
        );
    }

    if (nodo.tipo === "constante") {
        return nodo.nombre === "pi"
            ? crearNodoTexto("π", "math-constant")
            : crearNodoTexto(nodo.nombre, "math-variable");
    }

    if (nodo.tipo === "unario") {
        const grupo = document.createElement("span");
        grupo.className = "math-unary";
        grupo.append(
            crearNodoTexto(nodo.operador === "-" ? "−" : "+", "math-sign"),
            crearGrupoMatematico(nodo.argumento, 2, true)
        );
        return grupo;
    }

    if (nodo.tipo === "funcion") {
        if (nodo.nombre === "sqrt") {
            return crearRaizCuadrada(nodo.argumento);
        }

        const grupo = document.createElement("span");
        grupo.className = "math-function";
        grupo.append(
            crearNodoTexto(nodo.nombre, "math-function-name"),
            ...crearArgumentoFuncion(nodo.argumento)
        );
        return grupo;
    }

    if (nodo.tipo === "binario") {

        if (nodo.operador === "/") {
            const fraccion = document.createElement("span");
            fraccion.className = "math-fraction";

            const numerador = document.createElement("span");
            numerador.className = "math-numerator";
            numerador.appendChild(renderizarNodoMatematico(nodo.izquierdo));

            const denominador = document.createElement("span");
            denominador.className = "math-denominator";
            denominador.appendChild(renderizarNodoMatematico(nodo.derecho));

            fraccion.append(numerador, denominador);
            return fraccion;
        }

        if (nodo.operador === "^") {
            const potencia = document.createElement("span");
            potencia.className = "math-power";

            const exponente = document.createElement("span");
            exponente.className = "math-exponent";
            exponente.appendChild(renderizarNodoMatematico(nodo.derecho));

            if (esBaseConNombreDeFuncion(nodo.izquierdo)) {
                // sin²(x): el exponente va junto al nombre
                potencia.append(
                    crearNodoTexto(nodo.izquierdo.nombre, "math-function-name"),
                    exponente,
                    ...crearArgumentoFuncion(nodo.izquierdo.argumento)
                );
                return potencia;
            }

            potencia.append(
                necesitaParentesisBase(nodo.izquierdo)
                    ? envolverConParentesis(nodo.izquierdo)
                    : renderizarNodoMatematico(nodo.izquierdo),
                exponente
            );
            return potencia;
        }

        if (nodo.operador === "*") {
            const producto = document.createElement("span");
            producto.className = "math-binary";

            const derechoConParentesis =
                necesitaParentesis(nodo.derecho, 2, true);

            const operador = crearOperadorProducto(
                nodo.izquierdo,
                nodo.derecho,
                derechoConParentesis
            );

            producto.appendChild(crearGrupoMatematico(nodo.izquierdo, 2));

            if (operador) {
                producto.appendChild(operador);
            }

            producto.appendChild(crearGrupoMatematico(nodo.derecho, 2, true));
            return producto;
        }

        const suma = document.createElement("span");
        suma.className = "math-binary";
        suma.append(
            crearGrupoMatematico(nodo.izquierdo, 1),
            crearNodoTexto(nodo.operador === "-" ? "−" : "+", "math-operator"),
            crearGrupoMatematico(
                nodo.derecho,
                nodo.operador === "-" ? 2 : 1,
                true
            )
        );
        return suma;
    }

    throw new Error("Nodo matemático desconocido");
}

function aplanarSumaVisual(nodo) {

    if (
        nodo.tipo === "binario" &&
        (nodo.operador === "+" || nodo.operador === "-")
    ) {
        return [
            ...aplanarSumaVisual(nodo.izquierdo),
            { operador: nodo.operador, nodo: nodo.derecho }
        ];
    }

    return [{ operador: null, nodo }];
}

function renderizarExpresionMatematica(arbol) {

    // Cada término de la suma principal es un bloque que no se
    // parte por dentro. Si la expresión es muy larga, pasa a una
    // segunda línea entre términos, nunca letra por letra.

    const expresion = document.createElement("span");
    expresion.className = "math-expression";

    for (const termino of aplanarSumaVisual(arbol)) {
        const bloque = document.createElement("span");
        bloque.className = "math-term";

        if (termino.operador) {
            bloque.append(
                crearNodoTexto(
                    termino.operador === "-" ? "−" : "+",
                    "math-operator"
                ),
                crearGrupoMatematico(
                    termino.nodo,
                    termino.operador === "-" ? 2 : 1,
                    true
                )
            );
        } else {
            bloque.appendChild(renderizarNodoMatematico(termino.nodo));
        }

        expresion.appendChild(bloque);
    }

    return expresion;
}

function crearNodoNumero(valor) {
    return {
        tipo: "numero",
        valor
    };
}

function crearNodoBinario(operador, izquierdo, derecho) {
    return {
        tipo: "binario",
        operador,
        izquierdo,
        derecho
    };
}

function derivarArbolMatematico(nodo) {

    if (nodo.tipo === "numero" || nodo.tipo === "constante") {
        return crearNodoNumero(
            nodo.tipo === "constante" && nodo.nombre === "x"
                ? 1
                : 0
        );
    }

    if (nodo.tipo === "unario") {
        return nodo.operador === "-"
            ? {
                tipo: "unario",
                operador: "-",
                argumento: derivarArbolMatematico(nodo.argumento)
            }
            : derivarArbolMatematico(nodo.argumento);
    }

    if (nodo.tipo === "funcion") {
        const argumento = nodo.argumento;
        const derivadaArgumento = derivarArbolMatematico(argumento);

        if (nodo.nombre === "sin") {
            return crearNodoBinario(
                "*",
                {
                    tipo: "funcion",
                    nombre: "cos",
                    argumento
                },
                derivadaArgumento
            );
        }

        if (nodo.nombre === "cos") {
            return crearNodoBinario(
                "*",
                {
                    tipo: "unario",
                    operador: "-",
                    argumento: {
                        tipo: "funcion",
                        nombre: "sin",
                        argumento
                    }
                },
                derivadaArgumento
            );
        }

        if (nodo.nombre === "tan") {
            return crearNodoBinario(
                "/",
                derivadaArgumento,
                crearNodoBinario(
                    "^",
                    {
                        tipo: "funcion",
                        nombre: "cos",
                        argumento
                    },
                    crearNodoNumero(2)
                )
            );
        }

        if (nodo.nombre === "csc") {
            return crearNodoBinario(
                "*",
                {
                    tipo: "unario",
                    operador: "-",
                    argumento: {
                        tipo: "funcion",
                        nombre: "csc",
                        argumento
                    }
                },
                crearNodoBinario(
                    "*",
                    {
                        tipo: "funcion",
                        nombre: "cot",
                        argumento
                    },
                    derivadaArgumento
                )
            );
        }

        if (nodo.nombre === "sec") {
            return crearNodoBinario(
                "*",
                {
                    tipo: "funcion",
                    nombre: "sec",
                    argumento
                },
                crearNodoBinario(
                    "*",
                    {
                        tipo: "funcion",
                        nombre: "tan",
                        argumento
                    },
                    derivadaArgumento
                )
            );
        }

        if (nodo.nombre === "cot") {
            return crearNodoBinario(
                "*",
                {
                    tipo: "unario",
                    operador: "-",
                    argumento: crearNodoBinario(
                        "^",
                        {
                            tipo: "funcion",
                            nombre: "csc",
                            argumento
                        },
                        crearNodoNumero(2)
                    )
                },
                derivadaArgumento
            );
        }

        if (nodo.nombre === "ln") {
            return crearNodoBinario(
                "/",
                derivadaArgumento,
                argumento
            );
        }

        if (nodo.nombre === "log") {
            return crearNodoBinario(
                "/",
                derivadaArgumento,
                crearNodoBinario(
                    "*",
                    argumento,
                    crearNodoNumero(Math.LN10)
                )
            );
        }

        if (nodo.nombre === "sqrt") {
            return crearNodoBinario(
                "/",
                derivadaArgumento,
                crearNodoBinario(
                    "*",
                    crearNodoNumero(2),
                    {
                        tipo: "funcion",
                        nombre: "sqrt",
                        argumento
                    }
                )
            );
        }
    }

    if (nodo.tipo === "binario") {
        const izquierdo = nodo.izquierdo;
        const derecho = nodo.derecho;
        const derivadaIzquierda = derivarArbolMatematico(izquierdo);
        const derivadaDerecha = derivarArbolMatematico(derecho);

        if (nodo.operador === "+" || nodo.operador === "-") {
            return crearNodoBinario(
                nodo.operador,
                derivadaIzquierda,
                derivadaDerecha
            );
        }

        if (nodo.operador === "*") {
            return crearNodoBinario(
                "+",
                crearNodoBinario("*", derivadaIzquierda, derecho),
                crearNodoBinario("*", izquierdo, derivadaDerecha)
            );
        }

        if (nodo.operador === "/") {
            return crearNodoBinario(
                "/",
                crearNodoBinario(
                    "-",
                    crearNodoBinario("*", derivadaIzquierda, derecho),
                    crearNodoBinario("*", izquierdo, derivadaDerecha)
                ),
                crearNodoBinario("^", derecho, crearNodoNumero(2))
            );
        }

        if (nodo.operador === "^") {
            if (
                derecho.tipo === "numero" &&
                Number.isFinite(derecho.valor)
            ) {
                return crearNodoBinario(
                    "*",
                    crearNodoBinario(
                        "*",
                        derecho,
                        {
                            tipo: "binario",
                            operador: "^",
                            izquierdo,
                            derecho: crearNodoNumero(derecho.valor - 1)
                        }
                    ),
                    derivadaIzquierda
                );
            }

            if (
                izquierdo.tipo === "constante" &&
                izquierdo.nombre === "e"
            ) {
                return crearNodoBinario(
                    "*",
                    nodo,
                    derivadaDerecha
                );
            }

            return crearNodoBinario(
                "*",
                nodo,
                crearNodoBinario(
                    "+",
                    crearNodoBinario(
                        "*",
                        derivadaDerecha,
                        {
                            tipo: "funcion",
                            nombre: "ln",
                            argumento: izquierdo
                        }
                    ),
                    crearNodoBinario(
                        "/",
                        crearNodoBinario("*", derecho, derivadaIzquierda),
                        izquierdo
                    )
                )
            );
        }
    }

    return crearNodoNumero(0);
}

function esNumeroNodo(nodo, valor) {
    return nodo.tipo === "numero" && nodo.valor === valor;
}

function simplificarArbolMatematico(nodo) {

    if (nodo.tipo === "unario") {
        const argumento = simplificarArbolMatematico(nodo.argumento);

        if (nodo.operador === "+") {
            return argumento;
        }

        if (esNumeroNodo(argumento, 0)) {
            return argumento;
        }

        return { ...nodo, argumento };
    }

    if (nodo.tipo !== "binario") {
        return nodo;
    }

    const izquierdo = simplificarArbolMatematico(nodo.izquierdo);
    const derecho = simplificarArbolMatematico(nodo.derecho);

    if (nodo.operador === "+" || nodo.operador === "-") {
        if (esNumeroNodo(derecho, 0)) {
            return izquierdo;
        }

        if (esNumeroNodo(izquierdo, 0) && nodo.operador === "+") {
            return derecho;
        }
    }

    if (nodo.operador === "*") {
        if (esNumeroNodo(izquierdo, 0) || esNumeroNodo(derecho, 0)) {
            return crearNodoNumero(0);
        }

        if (esNumeroNodo(izquierdo, 1)) {
            return derecho;
        }

        if (esNumeroNodo(derecho, 1)) {
            return izquierdo;
        }

        if (
            izquierdo.tipo === "numero" &&
            derecho.tipo === "numero"
        ) {
            return crearNodoNumero(izquierdo.valor * derecho.valor);
        }
    }

    if (nodo.operador === "/") {
        if (esNumeroNodo(izquierdo, 0)) {
            return crearNodoNumero(0);
        }

        if (esNumeroNodo(derecho, 1)) {
            return izquierdo;
        }
    }

    if (nodo.operador === "^") {
        if (esNumeroNodo(derecho, 0)) {
            return crearNodoNumero(1);
        }

        if (esNumeroNodo(derecho, 1)) {
            return izquierdo;
        }
    }

    return {
        ...nodo,
        izquierdo,
        derecho
    };
}

/* =====================================================
   SIMPLIFICACIÓN VISUAL DE EXPRESIONES
   Solo se usa para MOSTRAR las derivadas en pantalla.
   No toca los árboles que usan los cálculos: trabaja
   sobre copias, y si algo falla o el resultado no da
   los mismos valores numéricos, se muestra el original.
===================================================== */

const toleranciaVisual = 1e-10;

function maximoComunDivisor(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b) {
        const resto = a % b;
        a = b;
        b = resto;
    }

    return a;
}

function crearRacional(numerador, denominador = 1) {

    if (
        denominador === 0 ||
        !Number.isFinite(numerador) ||
        !Number.isFinite(denominador)
    ) {
        throw new Error("Coeficiente no válido");
    }

    // Enteros: se guarda como fracción reducida (1/2, 3/4...)
    if (
        Number.isInteger(numerador) &&
        Number.isInteger(denominador) &&
        Math.abs(numerador) <= 1e12 &&
        Math.abs(denominador) <= 1e12
    ) {
        const divisor = maximoComunDivisor(numerador, denominador) || 1;
        const signo = denominador < 0 ? -1 : 1;

        return {
            n: (signo * numerador) / divisor + 0,
            d: (signo * denominador) / divisor
        };
    }

    // Decimales: se guarda el valor directamente
    return {
        n: numerador / denominador + 0,
        d: 1
    };
}

function valorRacional(racional) {
    return racional.n / racional.d;
}

function esRacionalCero(racional) {
    return Math.abs(valorRacional(racional)) < toleranciaVisual;
}

function esRacionalUno(racional) {
    return Math.abs(valorRacional(racional) - 1) < toleranciaVisual;
}

function multiplicarRacionales(a, b) {
    return crearRacional(a.n * b.n, a.d * b.d);
}

function sumarRacionales(a, b) {
    return crearRacional(a.n * b.d + b.n * a.d, a.d * b.d);
}

function invertirRacional(racional) {

    if (esRacionalCero(racional)) {
        throw new Error("División entre cero");
    }

    return crearRacional(racional.d, racional.n);
}

function elevarRacional(racional, exponente) {

    if (exponente < 0) {
        return elevarRacional(invertirRacional(racional), -exponente);
    }

    return crearRacional(racional.n ** exponente, racional.d ** exponente);
}

/* Un término es: coeficiente · factor₁^exp₁ · factor₂^exp₂ ...
   Los exponentes negativos son los que van en el denominador. */

function claveDeNodo(nodo) {

    if (nodo.tipo === "numero") {
        return "n" + nodo.valor;
    }

    if (nodo.tipo === "constante") {
        return nodo.nombre;
    }

    if (nodo.tipo === "unario" || nodo.tipo === "funcion") {
        return (
            (nodo.tipo === "unario" ? nodo.operador : nodo.nombre) +
            "(" + claveDeNodo(nodo.argumento) + ")"
        );
    }

    return (
        "(" + claveDeNodo(nodo.izquierdo) +
        nodo.operador +
        claveDeNodo(nodo.derecho) + ")"
    );
}

function crearTermino(coeficiente, factores = []) {
    return {
        coeficiente,
        factores
    };
}

function crearFactorVisual(base, exponente) {
    return {
        clave: claveDeNodo(base),
        base,
        exponente
    };
}

function terminoConFactor(base, exponente = 1) {
    return crearTermino(
        crearRacional(1),
        [crearFactorVisual(base, exponente)]
    );
}

function copiarFactores(factores) {
    return factores.map(factor => ({ ...factor }));
}

function agregarFactor(factores, factorNuevo) {

    const existente = factores.find(
        factor => factor.clave === factorNuevo.clave
    );

    if (!existente) {
        if (Math.abs(factorNuevo.exponente) >= toleranciaVisual) {
            factores.push({ ...factorNuevo });
        }
        return;
    }

    // x² · x³ = x⁵   ·   x / x = 1
    existente.exponente += factorNuevo.exponente;

    if (Math.abs(existente.exponente) < toleranciaVisual) {
        factores.splice(factores.indexOf(existente), 1);
    }
}

function negarTermino(termino) {
    return crearTermino(
        crearRacional(-termino.coeficiente.n, termino.coeficiente.d),
        copiarFactores(termino.factores)
    );
}

function multiplicarTerminos(a, b) {

    const factores = copiarFactores(a.factores);

    for (const factor of b.factores) {
        agregarFactor(factores, factor);
    }

    return cancelarFactoresComunes(
        resolverRaicesCuadradas(
            crearTermino(
                multiplicarRacionales(a.coeficiente, b.coeficiente),
                factores
            )
        )
    );
}

function invertirTermino(termino) {
    return crearTermino(
        invertirRacional(termino.coeficiente),
        termino.factores.map(factor => ({
            ...factor,
            exponente: -factor.exponente
        }))
    );
}

function elevarTermino(termino, exponente) {

    // Solo para exponentes enteros: (2x)³ = 8x³
    if (exponente === 0) {
        return crearTermino(crearRacional(1));
    }

    return resolverRaicesCuadradas(
        crearTermino(
            elevarRacional(termino.coeficiente, exponente),
            termino.factores.map(factor => ({
                ...factor,
                exponente: factor.exponente * exponente
            }))
        )
    );
}

function resolverRaicesCuadradas(termino) {

    // (√u)² = u   ·   (√u)³ = u·√u   ·   (√u)⁻³ = 1 / (u·√u)
    const pendientes = [];
    const factores = [];

    for (const factor of termino.factores) {
        const esRaiz =
            factor.base.tipo === "funcion" &&
            factor.base.nombre === "sqrt";

        if (
            esRaiz &&
            Number.isInteger(factor.exponente) &&
            Math.abs(factor.exponente) >= 2
        ) {
            const pares = Math.trunc(factor.exponente / 2);
            const resto = factor.exponente - 2 * pares;

            pendientes.push(
                elevarTermino(normalizarTermino(factor.base.argumento), pares)
            );

            if (resto !== 0) {
                factores.push({ ...factor, exponente: resto });
            }

            continue;
        }

        factores.push({ ...factor });
    }

    let resultadoTermino = crearTermino(termino.coeficiente, factores);

    for (const extra of pendientes) {
        resultadoTermino = multiplicarTerminos(resultadoTermino, extra);
    }

    return resultadoTermino;
}

function esNodoSuma(nodo) {
    return (
        nodo.tipo === "binario" &&
        (nodo.operador === "+" || nodo.operador === "-")
    );
}

function normalizarTermino(nodo) {

    if (nodo.tipo === "numero") {
        if (esNodoLogaritmoDiez(nodo)) {
            return terminoConFactor({
                tipo: "funcion",
                nombre: "ln",
                argumento: crearNodoNumero(10)
            });
        }

        return crearTermino(crearRacional(nodo.valor));
    }

    if (nodo.tipo === "constante") {
        return terminoConFactor(nodo);
    }

    if (nodo.tipo === "unario") {
        const termino = normalizarTermino(nodo.argumento);
        return nodo.operador === "-" ? negarTermino(termino) : termino;
    }

    if (nodo.tipo === "funcion") {
        return terminoConFactor({
            tipo: "funcion",
            nombre: nodo.nombre,
            argumento: construirSumaVisual(normalizarSuma(nodo.argumento))
        });
    }

    if (nodo.tipo === "binario") {

        if (esNodoSuma(nodo)) {
            const terminos = normalizarSuma(nodo);

            if (terminos.length === 0) {
                return crearTermino(crearRacional(0));
            }

            if (terminos.length === 1) {
                return terminos[0];
            }

            return terminoConFactor(construirSumaVisual(terminos));
        }

        if (nodo.operador === "*") {
            return multiplicarTerminos(
                normalizarTermino(nodo.izquierdo),
                normalizarTermino(nodo.derecho)
            );
        }

        if (nodo.operador === "/") {
            return multiplicarTerminos(
                normalizarTermino(nodo.izquierdo),
                invertirTermino(normalizarTermino(nodo.derecho))
            );
        }

        if (nodo.operador === "^") {
            return normalizarPotencia(nodo);
        }
    }

    throw new Error("Nodo matemático desconocido");
}

function normalizarPotencia(nodo) {

    const terminosExponente = normalizarSuma(nodo.derecho);
    const base = normalizarTermino(nodo.izquierdo);

    let exponente = null;

    if (terminosExponente.length === 0) {
        exponente = 0;
    } else if (
        terminosExponente.length === 1 &&
        terminosExponente[0].factores.length === 0
    ) {
        exponente = valorRacional(terminosExponente[0].coeficiente);
    }

    // Exponente con variables (por ejemplo e^x): se deja igual
    if (exponente === null) {
        return terminoConFactor(
            crearNodoBinario(
                "^",
                construirTerminoVisual(base),
                construirSumaVisual(terminosExponente)
            )
        );
    }

    if (Number.isInteger(exponente)) {
        return elevarTermino(base, exponente);
    }

    // Exponente decimal sobre una sola variable o función: x^1.5
    if (
        esRacionalUno(base.coeficiente) &&
        base.factores.length === 1 &&
        base.factores[0].exponente === 1
    ) {
        return terminoConFactor(base.factores[0].base, exponente);
    }

    return terminoConFactor(
        crearNodoBinario(
            "^",
            construirTerminoVisual(base),
            crearNodoNumero(exponente)
        )
    );
}

function recolectarTerminos(nodo, negativo, terminos) {

    if (esNodoSuma(nodo)) {
        recolectarTerminos(nodo.izquierdo, negativo, terminos);
        recolectarTerminos(
            nodo.derecho,
            nodo.operador === "-" ? !negativo : negativo,
            terminos
        );
        return;
    }

    if (nodo.tipo === "unario") {
        recolectarTerminos(
            nodo.argumento,
            nodo.operador === "-" ? !negativo : negativo,
            terminos
        );
        return;
    }

    const termino = normalizarTermino(nodo);

    // ±(a + b) se reparte en sus términos: −(x − 1) = −x + 1
    const esSumaAgrupada =
        termino.factores.length === 1 &&
        termino.factores[0].exponente === 1 &&
        esNodoSuma(termino.factores[0].base) &&
        Math.abs(Math.abs(valorRacional(termino.coeficiente)) - 1) <
            toleranciaVisual;

    if (esSumaAgrupada) {
        recolectarTerminos(
            termino.factores[0].base,
            (valorRacional(termino.coeficiente) < 0) !== negativo,
            terminos
        );
        return;
    }

    terminos.push(negativo ? negarTermino(termino) : termino);
}

function claveDeTermino(termino) {
    return termino.factores
        .map(factor => factor.clave + "^" + factor.exponente)
        .sort()
        .join("·");
}

function combinarTerminosSemejantes(terminos) {

    // 2x + 3x = 5x   ·   x + 1 − x = 1
    const grupos = [];

    for (const termino of terminos) {
        const clave = claveDeTermino(termino);
        const grupo = grupos.find(existente => existente.clave === clave);

        if (grupo) {
            grupo.termino = crearTermino(
                sumarRacionales(
                    grupo.termino.coeficiente,
                    termino.coeficiente
                ),
                grupo.termino.factores
            );
        } else {
            grupos.push({ clave, termino });
        }
    }

    return grupos
        .map(grupo => grupo.termino)
        .filter(termino => !esRacionalCero(termino.coeficiente));
}

function gradoDeTermino(termino) {

    if (termino.factores.length === 0) {
        return 0;
    }

    const factor = termino.factores[0];

    if (
        termino.factores.length === 1 &&
        factor.clave === "x" &&
        Number.isInteger(factor.exponente) &&
        factor.exponente > 0
    ) {
        return factor.exponente;
    }

    return null;
}

function ordenarTerminosVisuales(terminos) {

    const grados = terminos.map(gradoDeTermino);
    const indices = terminos.map((_, indice) => indice);

    if (grados.every(grado => grado !== null)) {
        // Polinomio: de mayor a menor grado (3x² − 3)
        indices.sort((a, b) => grados[b] - grados[a] || a - b);

        // Binomio que empezaría en negativo: 4 − x² en vez de −x² + 4
        if (
            indices.length === 2 &&
            valorRacional(terminos[indices[0]].coeficiente) < 0 &&
            valorRacional(terminos[indices[1]].coeficiente) > 0
        ) {
            indices.reverse();
        }
    } else {
        // Otros casos: se respeta el orden y la constante va al final
        indices.sort(
            (a, b) => (grados[a] === 0) - (grados[b] === 0) || a - b
        );
    }

    return indices.map(indice => terminos[indice]);
}

const limiteTerminosExpansion = 24;

let memoriaSumas = null;

function tamanoDeNodo(nodo) {

    if (nodo.tipo === "binario") {
        return 1 + tamanoDeNodo(nodo.izquierdo) + tamanoDeNodo(nodo.derecho);
    }

    if (nodo.tipo === "unario" || nodo.tipo === "funcion") {
        return 1 + tamanoDeNodo(nodo.argumento);
    }

    return 1;
}

function elegirMasSimple(opciones) {

    // Se queda con la opción que se escribe con menos símbolos
    let mejor = opciones[0];
    let tamanoMejor = tamanoDeNodo(construirSumaVisual(mejor));

    for (const opcion of opciones.slice(1)) {
        const tamano = tamanoDeNodo(construirSumaVisual(opcion));

        if (tamano < tamanoMejor) {
            mejor = opcion;
            tamanoMejor = tamano;
        }
    }

    return mejor;
}

function terminoDeSuma(terminos) {

    if (!terminos.length) {
        return crearTermino(crearRacional(0));
    }

    if (terminos.length === 1) {
        return terminos[0];
    }

    return terminoConFactor(construirSumaVisual(terminos));
}

function esSumaSimple(factor) {
    return factor.exponente === 1 && esNodoSuma(factor.base);
}

function esFactorExpandible(factor, amplia) {

    // Normal: solo (x + 1). Amplia: también (x − 1)² y (x + 2)³
    return (
        esNodoSuma(factor.base) &&
        Number.isInteger(factor.exponente) &&
        factor.exponente >= 1 &&
        factor.exponente <= (amplia ? 3 : 1)
    );
}

function expandirTermino(termino, amplia) {

    // 2x(x² + 1) → 2x³ + 2x   ·   (x − 1)² → x² − 2x + 1
    let parciales = [
        crearTermino(
            termino.coeficiente,
            termino.factores.filter(
                factor => !esFactorExpandible(factor, amplia)
            )
        )
    ];

    for (const factor of termino.factores) {
        if (!esFactorExpandible(factor, amplia)) {
            continue;
        }

        const sumandos = normalizarSuma(factor.base);

        for (let vez = 0; vez < factor.exponente; vez++) {
            const siguientes = [];

            for (const parcial of parciales) {
                for (const sumando of sumandos) {
                    siguientes.push(multiplicarTerminos(parcial, sumando));
                }
            }

            if (siguientes.length > limiteTerminosExpansion) {
                return null;
            }

            parciales = combinarTerminosSemejantes(siguientes);
        }
    }

    return parciales;
}

function expandirTerminos(terminos, amplia) {

    const hayQueExpandir = terminos.some(
        termino => termino.factores.some(
            factor => esFactorExpandible(factor, amplia)
        )
    );

    if (!hayQueExpandir) {
        return null;
    }

    const resultadoTerminos = [];

    for (const termino of terminos) {
        const expandido = expandirTermino(termino, amplia);

        if (!expandido) {
            return null;
        }

        resultadoTerminos.push(...expandido);

        if (resultadoTerminos.length > limiteTerminosExpansion) {
            return null;
        }
    }

    return combinarTerminosSemejantes(resultadoTerminos);
}

function combinarSobreDenominadorComun(terminos) {

    // √u − x²/√u → (u − x²)/√u
    if (terminos.length < 2) {
        return null;
    }

    const comunes = [];

    for (const termino of terminos) {
        for (const factor of termino.factores) {
            if (factor.exponente >= 0) {
                continue;
            }

            const existente = comunes.find(
                comun => comun.clave === factor.clave
            );

            if (existente) {
                existente.exponente = Math.max(
                    existente.exponente,
                    -factor.exponente
                );
            } else {
                comunes.push({ ...factor, exponente: -factor.exponente });
            }
        }
    }

    if (!comunes.length) {
        return null;
    }

    const multiplicador = crearTermino(crearRacional(1), comunes);

    // En el numerador sí se permite desarrollar (x − 1)², para que
    // los términos puedan anularse: 2(x − 1)² − 2(x² − 2x) = 2
    const numerador = normalizarSuma(
        construirSumaVisual(
            terminos.map(termino => multiplicarTerminos(termino, multiplicador))
        ),
        true
    );

    if (!numerador.length) {
        return [];
    }

    return [
        multiplicarTerminos(
            terminoDeSuma(numerador),
            invertirTermino(multiplicador)
        )
    ];
}

function cancelarFactoresComunes(termino) {

    // [4(x² + 1)² − 16x²(x² + 1)] / (x² + 1)⁴  →  [4(x² + 1) − 16x²] / (x² + 1)³
    const indiceSuma = termino.factores.findIndex(esSumaSimple);

    if (indiceSuma < 0) {
        return termino;
    }

    const denominadores = termino.factores.filter(
        factor => factor.exponente < 0
    );

    if (!denominadores.length && termino.coeficiente.d === 1) {
        return termino;
    }

    let sumandos = normalizarSuma(termino.factores[indiceSuma].base);
    const extraidos = [];

    for (const denominador of denominadores) {
        const exponentes = sumandos.map(sumando => {
            const factor = sumando.factores.find(
                candidato => candidato.clave === denominador.clave
            );
            return factor ? factor.exponente : 0;
        });

        const comun = Math.min(-denominador.exponente, ...exponentes);

        if (!(comun > 0)) {
            continue;
        }

        const divisor = terminoConFactor(denominador.base, -comun);
        sumandos = sumandos.map(sumando => multiplicarTerminos(sumando, divisor));
        extraidos.push(terminoConFactor(denominador.base, comun));
    }

    // Número común: (4 − 12x²) / 8 → (1 − 3x²) / 2
    let divisorNumerico = 1;

    if (
        termino.coeficiente.d !== 1 &&
        sumandos.every(
            sumando =>
                sumando.coeficiente.d === 1 &&
                Number.isInteger(sumando.coeficiente.n)
        )
    ) {
        const mcdSuma = sumandos.reduce(
            (acumulado, sumando) =>
                maximoComunDivisor(acumulado, sumando.coeficiente.n),
            0
        );

        divisorNumerico = maximoComunDivisor(mcdSuma, termino.coeficiente.d);
    }

    if (!extraidos.length && divisorNumerico <= 1) {
        return termino;
    }

    if (divisorNumerico > 1) {
        sumandos = sumandos.map(sumando =>
            crearTermino(
                crearRacional(sumando.coeficiente.n / divisorNumerico),
                sumando.factores
            )
        );
    }

    let resultadoTermino = crearTermino(
        multiplicarRacionales(
            termino.coeficiente,
            crearRacional(divisorNumerico)
        ),
        termino.factores.filter((_, indice) => indice !== indiceSuma)
    );

    resultadoTermino = multiplicarTerminos(
        resultadoTermino,
        terminoDeSuma(normalizarSuma(construirSumaVisual(sumandos)))
    );

    for (const extraido of extraidos) {
        resultadoTermino = multiplicarTerminos(resultadoTermino, extraido);
    }

    return resultadoTermino;
}

function normalizarSuma(nodo, amplia = false) {

    const clave = memoriaSumas
        ? (amplia ? "amplia:" : "") + claveDeNodo(nodo)
        : null;

    if (clave !== null && memoriaSumas.has(clave)) {
        return memoriaSumas.get(clave);
    }

    const terminos = [];
    recolectarTerminos(nodo, false, terminos);

    // Se prueban varias formas equivalentes y se elige la más corta
    const opciones = [combinarTerminosSemejantes(terminos)];
    const expandidos = expandirTerminos(opciones[0], amplia);

    if (expandidos) {
        opciones.push(expandidos);
    }

    const conDenominadorComun = combinarSobreDenominadorComun(
        elegirMasSimple(opciones)
    );

    if (conDenominadorComun) {
        opciones.push(conDenominadorComun);
    }

    const resultadoSuma = ordenarTerminosVisuales(elegirMasSimple(opciones));

    if (clave !== null) {
        memoriaSumas.set(clave, resultadoSuma);
    }

    return resultadoSuma;
}

function categoriaFactorVisual(factor) {

    // Orden al escribir un producto: 4x²(x + 1)√x sin(x)
    const base = factor.base;

    if (base.tipo === "constante") {
        return 0;
    }

    if (esNodoSuma(base)) {
        return 1;
    }

    if (base.tipo === "binario") {
        return 2;
    }

    if (base.tipo === "funcion" && base.nombre === "sqrt") {
        return 3;
    }

    if (
        base.tipo === "funcion" &&
        base.argumento.tipo === "numero"
    ) {
        return 5;
    }

    return 4;
}

function nodoConExponente(base, exponente) {

    if (Math.abs(exponente - 1) < toleranciaVisual) {
        return base;
    }

    return crearNodoBinario("^", base, crearNodoNumero(exponente));
}

function multiplicarNodosVisuales(nodos) {
    return nodos.reduce(
        (acumulado, nodo) => crearNodoBinario("*", acumulado, nodo)
    );
}

function construirTerminoVisual(termino) {

    if (valorRacional(termino.coeficiente) < 0) {
        return {
            tipo: "unario",
            operador: "-",
            argumento: construirTerminoVisual(negarTermino(termino))
        };
    }

    const factores = termino.factores
        .map((factor, indice) => ({ factor, indice }))
        .sort(
            (a, b) =>
                categoriaFactorVisual(a.factor) -
                    categoriaFactorVisual(b.factor) ||
                a.indice - b.indice
        )
        .map(elemento => elemento.factor);

    const arriba = factores
        .filter(factor => factor.exponente > 0)
        .map(factor => nodoConExponente(factor.base, factor.exponente));

    const abajo = factores
        .filter(factor => factor.exponente < 0)
        .map(factor => nodoConExponente(factor.base, -factor.exponente));

    const { n, d } = termino.coeficiente;

    if (
        arriba.length === 0 ||
        Math.abs(n - 1) >= toleranciaVisual
    ) {
        arriba.unshift(crearNodoNumero(n));
    }

    if (d !== 1) {
        abajo.unshift(crearNodoNumero(d));
    }

    const numerador = multiplicarNodosVisuales(arriba);

    if (!abajo.length) {
        return numerador;
    }

    return crearNodoBinario(
        "/",
        numerador,
        multiplicarNodosVisuales(abajo)
    );
}

function construirSumaVisual(terminos) {

    if (!terminos.length) {
        return crearNodoNumero(0);
    }

    let nodo = construirTerminoVisual(terminos[0]);

    for (const termino of terminos.slice(1)) {
        const negativo = valorRacional(termino.coeficiente) < 0;

        nodo = crearNodoBinario(
            negativo ? "-" : "+",
            nodo,
            construirTerminoVisual(
                negativo ? negarTermino(termino) : termino
            )
        );
    }

    return nodo;
}

function sonArbolesEquivalentes(original, simplificado) {

    // Comprobación de seguridad: ambos árboles deben dar
    // el mismo valor en varios puntos donde estén definidos.
    const muestras = [
        -7.3, -3.7, -2.1, -1.3, -0.6, 0.35,
        0.8, 1.7, 2.6, 4.2, 6.9, 13.5
    ];

    let comparaciones = 0;

    for (const x of muestras) {
        let valorOriginal;
        let valorSimplificado;

        try {
            valorOriginal = evaluarArbolMatematico(original, x, 0);
            valorSimplificado = evaluarArbolMatematico(simplificado, x, 0);
        } catch (error) {
            continue;
        }

        if (
            !Number.isFinite(valorOriginal) ||
            !Number.isFinite(valorSimplificado)
        ) {
            continue;
        }

        const escala = Math.max(
            1,
            Math.abs(valorOriginal),
            Math.abs(valorSimplificado)
        );

        if (Math.abs(valorOriginal - valorSimplificado) > 1e-6 * escala) {
            return false;
        }

        comparaciones++;
    }

    return comparaciones > 0;
}

function simplificarParaMostrar(arbol) {

    memoriaSumas = new Map();

    try {
        const simplificado = construirSumaVisual(normalizarSuma(arbol));

        return sonArbolesEquivalentes(arbol, simplificado)
            ? simplificado
            : arbol;
    } catch (error) {
        return arbol;
    } finally {
        memoriaSumas = null;
    }
}

function mostrarDerivadaActual() {

    console.log("DERIVADA - función de cálculo ejecutada");

    if (
        !resultado ||
        !funcionActual ||
        esFuncionDosVariables(funcionActual)
    ) {
        console.log("DERIVADA - salida anticipada:", {
            existeResultado: Boolean(resultado),
            existeFuncion: Boolean(funcionActual),
            esFuncionDosVariables: esFuncionDosVariables(funcionActual)
        });
        return;
    }

    try {
        const arbol = parsearExpresion(funcionTextoActual);
        arbolDerivadaActual = simplificarArbolMatematico(
            derivarArbolMatematico(arbol)
        );
        const arbolSegundaDerivada = simplificarArbolMatematico(
            derivarArbolMatematico(arbolDerivadaActual)
        );

        funcionDerivadaActual =
            crearFuncionEvaluable(arbolDerivadaActual);

        funcionSegundaDerivadaActual =
            crearFuncionEvaluable(arbolSegundaDerivada);

        arbolSegundaDerivadaActual = arbolSegundaDerivada;

        console.log("DERIVADA - derivada calculada:", arbolDerivadaActual);
        console.log("DERIVADA - derivada renderizada");
    } catch (error) {
        arbolDerivadaActual = null;
        arbolSegundaDerivadaActual = null;
        funcionDerivadaActual = null;
        funcionSegundaDerivadaActual = null;
    }
}

function mostrarRetoAplicado(a) {

    if (!resultado) {
        return;
    }

    if (
        !funcionActual ||
        esFuncionDosVariables(funcionActual)
    ) {
        mostrarMensajeResultado(
            "Carga una función válida de una variable para activar el reto."
        );
        return;
    }

    if (!Number.isFinite(a)) {
        mostrarMensajeResultado(
            "Ingresa un valor de X donde la función esté definida."
        );
        return;
    }

    try {
        const valorFuncion = funcionActual(a);
        const arbol = parsearExpresion(funcionTextoActual);
        const arbolDerivada = simplificarArbolMatematico(
            derivarArbolMatematico(arbol)
        );
        const funcionDerivada = crearFuncionEvaluable(arbolDerivada);
        const valorDerivada = funcionDerivada(a);

        if (
            !Number.isFinite(valorFuncion) ||
            !Number.isFinite(valorDerivada)
        ) {
            mostrarMensajeResultado(
                "Ingresa un valor de X donde la función esté definida."
            );
            return;
        }

        const tolerancia = 1e-5;
        const formatear = valor => Number(valor.toFixed(4));
        const mostrarValor = valor =>
            String(formatear(valor)).replace("-", "−");
        let interpretacion;

        if (valorDerivada > tolerancia) {
            interpretacion =
                "En a, la función está creciendo. Su razón de cambio es " +
                mostrarValor(valorDerivada) +
                " unidades por unidad de x.";
        } else if (valorDerivada < -tolerancia) {
            interpretacion =
                "En a, la función está decreciendo. Su razón de cambio es " +
                mostrarValor(valorDerivada) +
                " unidades por unidad de x.";
        } else {
            interpretacion =
                "En a, el cambio instantáneo es aproximadamente cero. " +
                "Es un candidato a punto de optimización.";
        }

        const datos = [
            "a = " + mostrarValor(a),
            "f(a) = " + mostrarValor(valorFuncion),
            "f′(a) = " + mostrarValor(valorDerivada)
        ];

        mostrarEnResultado(
            "reto|" + datos.join("|"),
            () => [
                crearLineaResultado(
                    datos.map(dato => crearDatoResultado(dato))
                ),
                crearNodoTexto(interpretacion, "resultado-interpretacion")
            ]
        );
    } catch (error) {
        console.error("No se pudo calcular el reto aplicado:", error);
        mostrarMensajeResultado(
            "No se pudo calcular el reto. Revisa la función y el valor de X."
        );
    }
}

function formatearValorPanel(valor) {
    if (!Number.isFinite(valor)) {
        return "—";
    }

    return String(Number(valor.toFixed(4)));
}


/* =====================================================
   PRESENTACIÓN DEL PANEL "RESULTADO"
   El contenido solo se vuelve a construir cuando cambia,
   así no se rehace el HTML en cada frame de la cámara.
===================================================== */

let claveResultadoActual = null;

function mostrarEnResultado(clave, crearContenido) {

    if (!resultado || clave === claveResultadoActual) {
        return;
    }

    claveResultadoActual = clave;

    const contenido = crearContenido();

    resultado.replaceChildren(
        ...(Array.isArray(contenido) ? contenido : [contenido])
    );
}

function mostrarMensajeResultado(texto) {
    mostrarEnResultado(
        "mensaje|" + texto,
        () => crearNodoTexto(texto, "resultado-mensaje")
    );
}

function formatearValorMostrar(valor) {

    // Igual que formatearValorPanel, pero con el signo menos
    // tipográfico (−) en lugar del guion (-)
    return formatearValorPanel(valor).replace("-", "−");
}

function crearTextoMatematico(texto, clase = "") {

    // Escribe las letras (x, y, f, a) en cursiva, como en un libro
    const contenedor = crearNodoTexto("", ("math-text " + clase).trim());

    for (const parte of texto.split(/([a-z])/)) {
        if (!parte) {
            continue;
        }

        contenedor.appendChild(
            /^[a-z]$/.test(parte)
                ? crearNodoTexto(parte, "math-variable")
                : document.createTextNode(parte)
        );
    }

    return contenedor;
}

function crearLineaResultado(elementos, clase = "") {

    const linea = crearNodoTexto("", ("resultado-linea " + clase).trim());
    linea.append(...elementos);
    return linea;
}

function crearDatoResultado(texto) {
    return crearTextoMatematico(texto, "resultado-dato");
}

function crearFormulaResultado(etiqueta, arbol, clase = "") {

    const formula = renderizarExpresionMatematica(arbol);
    formula.classList.add("resultado-formula");

    return crearLineaResultado(
        [
            crearTextoMatematico(etiqueta, "resultado-etiqueta"),
            formula
        ],
        clase
    );
}

function crearPuntoCriticoResultado(punto) {

    const tarjeta = crearNodoTexto("", "resultado-dato resultado-critico");

    const claseTipo =
        punto.tipo === "mínimo"
            ? "minimo"
            : punto.tipo === "máximo"
                ? "maximo"
                : "critico";

    tarjeta.append(
        crearTextoMatematico("x = " + punto.x + ",  f(x) = " + punto.y),
        crearNodoTexto(punto.tipo, "resultado-insignia " + claseTipo)
    );

    return tarjeta;
}

function arbolATexto(nodo, prioridadPadre = 0) {
    if (!nodo) {
        return "—";
    }

    if (nodo.tipo === "numero") {
        return String(nodo.valor);
    }

    if (nodo.tipo === "constante") {
        return nodo.nombre === "pi" ? "π" : nodo.nombre;
    }

    if (nodo.tipo === "unario") {
        return (nodo.operador === "-" ? "-" : "") +
            arbolATexto(nodo.argumento, 4);
    }

    if (nodo.tipo === "funcion") {
        if (nodo.nombre === "sqrt") {
            return "√(" + arbolATexto(nodo.argumento) + ")";
        }

        return nodo.nombre + "(" + arbolATexto(nodo.argumento) + ")";
    }

    if (nodo.tipo === "binario") {
        const prioridad = obtenerPrioridadNodo(nodo);
        const izquierdo = arbolATexto(nodo.izquierdo, prioridad);
        const derecho = arbolATexto(
            nodo.derecho,
            nodo.operador === "-" || nodo.operador === "/"
                ? prioridad + 1
                : nodo.operador === "^"
                    ? 3
                    : prioridad
        );
        const texto = nodo.operador === "^"
            ? izquierdo + "^" + derecho
            : izquierdo + " " + nodo.operador + " " + derecho;

        if (prioridad < prioridadPadre) {
            return "(" + texto + ")";
        }

        return texto;
    }

    return "—";
}

function mostrarResultadoDerivadasVisuales() {
    if (
        !resultado ||
        !arbolDerivadaActual ||
        !arbolSegundaDerivadaActual
    ) {
        return;
    }

    // Solo el resultado final, ya simplificado para leerlo mejor.
    // Los colores coinciden con las curvas: f′ rosa y f″ amarilla.
    mostrarEnResultado(
        "derivadas|" + funcionTextoActual,
        () => [
            crearFormulaResultado(
                "f′(x) =",
                simplificarParaMostrar(arbolDerivadaActual),
                "resultado-derivada-primera"
            ),
            crearFormulaResultado(
                "f″(x) =",
                simplificarParaMostrar(arbolSegundaDerivadaActual),
                "resultado-derivada-segunda"
            )
        ]
    );
}

function textoAccionPorDedos(cantidadDedos) {
    if (cantidadDedos === 1) {
        return "Evaluación de la función / Punto en la gráfica";
    }

    if (cantidadDedos === 2) {
        return "Recta tangente";
    }

    if (cantidadDedos === 3) {
        return "Derivadas";
    }

    if (cantidadDedos === 4) {
        return "Puntos críticos / Máximos y mínimos";
    }

    if (cantidadDedos === 5) {
        return "Reto aplicado / Razón de cambio";
    }

    return "Esperando gesto";
}

function mostrarResultadoEnEspera() {
    if (!resultado) {
        return;
    }

    if (funcionTextoActual) {
        const etiqueta = esFuncionDosVariables(funcionActual)
            ? "f(x, y) ="
            : "f(x) =";

        mostrarEnResultado(
            "espera|" + funcionTextoActual,
            () => {
                try {
                    return [
                        crearFormulaResultado(
                            etiqueta,
                            parsearExpresion(funcionTextoActual),
                            "resultado-funcion"
                        ),
                        crearNodoTexto("Esperando gesto", "resultado-nota")
                    ];
                } catch (error) {
                    return crearNodoTexto(
                        "Esperando gesto",
                        "resultado-mensaje"
                    );
                }
            }
        );

        return;
    }

    mostrarMensajeResultado("Esperando gesto");
}

function pendienteNumericaEn(x) {
    if (!funcionActual || !Number.isFinite(x)) {
        return NaN;
    }

    const pasoDerivada = 0.0001;

    try {
        const valorAnterior = funcionActual(x - pasoDerivada);
        const valorSiguiente = funcionActual(x + pasoDerivada);

        if (
            !Number.isFinite(valorAnterior) ||
            !Number.isFinite(valorSiguiente)
        ) {
            return NaN;
        }

        return (valorSiguiente - valorAnterior) / (2 * pasoDerivada);
    } catch (error) {
        return NaN;
    }
}

function clasificarPuntoCriticoPanel(x) {
    if (!funcionActual || !Number.isFinite(x)) {
        return "punto crítico";
    }

    try {
        const arbol = parsearExpresion(funcionTextoActual);
        const derivada = crearFuncionEvaluable(
            derivarArbolMatematico(arbol)
        );
        const paso = Math.max(1e-5, Math.abs(x) * 1e-6);
        const izquierda = derivada(x - paso);
        const derecha = derivada(x + paso);

        if (!Number.isFinite(izquierda) || !Number.isFinite(derecha)) {
            return "punto crítico";
        }

        if (izquierda > 0 && derecha < 0) {
            return "máximo";
        }

        if (izquierda < 0 && derecha > 0) {
            return "mínimo";
        }
    } catch (error) {
        return "punto crítico";
    }

    return "punto crítico";
}

function textoRectaTangentePanel(x0, y0, pendiente) {
    const xTexto = formatearValorMostrar(x0);
    const yTexto = formatearValorMostrar(y0);
    const mTexto = formatearValorMostrar(pendiente);
    const intercepto = y0 - pendiente * x0;
    const pendienteNula = Math.abs(pendiente) < 1e-8 || mTexto === "0";

    // m·x escrito como en clase: x, −x o 3x (nunca 1x)
    const terminoX =
        mTexto === "1"
            ? "x"
            : mTexto === "−1"
                ? "−x"
                : mTexto + "x";

    let ecuacionExplicit;

    if (pendienteNula) {
        ecuacionExplicit = "y = " + yTexto;
    } else if (
        Math.abs(intercepto) < 1e-8 ||
        formatearValorMostrar(Math.abs(intercepto)) === "0"
    ) {
        ecuacionExplicit = "y = " + terminoX;
    } else if (intercepto > 0) {
        ecuacionExplicit =
            "y = " + terminoX + " + " + formatearValorMostrar(intercepto);
    } else {
        ecuacionExplicit =
            "y = " + terminoX + " − " + formatearValorMostrar(-intercepto);
    }

    // Forma punto-pendiente: y − y₀ = m(x − x₀), cuidando los signos
    const ladoY =
        yTexto === "0"
            ? "y"
            : y0 > 0
                ? "y − " + yTexto
                : "y + " + formatearValorMostrar(-y0);

    const factorX =
        xTexto === "0"
            ? "x"
            : x0 > 0
                ? "(x − " + xTexto + ")"
                : "(x + " + formatearValorMostrar(-x0) + ")";

    const coeficiente =
        mTexto === "1"
            ? ""
            : mTexto === "−1"
                ? "−"
                : mTexto;

    return {
        explicita: ecuacionExplicit,
        puntoPendiente:
            ladoY + " = " + (pendienteNula ? "0" : coeficiente + factorX)
    };
}

function describirProblemaMatematicoEn(x) {
    try {
        const arbol = parsearExpresion(funcionTextoActual);
        let formaIndeterminada = false;
        let denominadorCero = false;

        const recorrer = nodo => {
            if (nodo.tipo === "unario" || nodo.tipo === "funcion") {
                recorrer(nodo.argumento);
                return;
            }

            if (nodo.tipo !== "binario") {
                return;
            }

            recorrer(nodo.izquierdo);
            recorrer(nodo.derecho);

            if (nodo.operador !== "/") {
                return;
            }

            const numerador = evaluarArbolMatematico(
                nodo.izquierdo,
                x
            );
            const denominador = evaluarArbolMatematico(
                nodo.derecho,
                x
            );

            if (
                Number.isFinite(denominador) &&
                Math.abs(denominador) <= 1e-10
            ) {
                denominadorCero = true;

                if (
                    Number.isFinite(numerador) &&
                    Math.abs(numerador) <= 1e-10
                ) {
                    formaIndeterminada = true;
                }
            }
        };

        recorrer(arbol);

        if (formaIndeterminada) {
            return "Indeterminación detectada: forma 0/0. " +
                "No se calcula un límite automáticamente.";
        }

        if (denominadorCero) {
            return "No definido: el denominador es 0 en este punto.";
        }
    } catch (error) {
        return "No definido: la función no tiene valor real en este punto.";
    }

    return "No definido: la función no tiene valor real en este punto.";
}

function actualizarPanelesInteraccion(cantidadDedos) {
    const firmaActual =
        cantidadDedos + "|" +
        funcionTextoActual + "|" +
        puntoDerechaSeleccionado + "|" +
        posicionPuntoSeleccionadoX + "|" +
        (valorEvaluacionX?.value || "") + "|" +
        retoAplicadoSeleccionado + "|" +
        posicionRetoAplicadoX;

    if (firmaActual === firmaPanelInteraccion) {
        return;
    }

    firmaPanelInteraccion = firmaActual;

    if (accion) {
        accion.textContent = textoAccionPorDedos(cantidadDedos);
    }

    if (!resultado) {
        return;
    }

    if (
        !funcionActual ||
        esFuncionDosVariables(funcionActual)
    ) {
        if (!cantidadDedos) {
            mostrarResultadoEnEspera();
            return;
        }

        mostrarMensajeResultado(
            "Carga una función de una variable para ver el resultado."
        );
        return;
    }

    if (!cantidadDedos) {
        mostrarResultadoEnEspera();
        return;
    }

    if (cantidadDedos === 1) {
        if (
            !puntoDerechaSeleccionado ||
            posicionPuntoSeleccionadoX === null
        ) {
            const tieneValorX = Boolean(valorEvaluacionX?.value.trim());
            mostrarMensajeResultado(tieneValorX
                ? modalidadControl === "manual"
                    ? "Presiona Evaluar punto para usar el valor actual de X."
                    : "Vuelve a realizar el gesto de un dedo para evaluar el valor actual de X."
                : "Escribe un valor en el campo X para evaluar la función."
            );
            return;
        }

        let valorFuncion;

        try {
            valorFuncion = funcionActual(posicionPuntoSeleccionadoX);
        } catch (error) {
            valorFuncion = NaN;
        }

        if (!Number.isFinite(valorFuncion)) {
            mostrarMensajeResultado(
                describirProblemaMatematicoEn(posicionPuntoSeleccionadoX)
            );
            return;
        }

        const datos = [
            "x = " + formatearValorMostrar(posicionPuntoSeleccionadoX),
            "f(x) = " + formatearValorMostrar(valorFuncion)
        ];

        mostrarEnResultado(
            "punto|" + datos.join("|"),
            () => crearLineaResultado(
                datos.map(dato => crearDatoResultado(dato))
            )
        );
        return;
    }

    if (cantidadDedos === 2) {
        if (
            !puntoDerechaSeleccionado ||
            posicionPuntoSeleccionadoX === null
        ) {
            mostrarMensajeResultado(
                "Selecciona un punto con 1 dedo para ver la recta tangente."
            );
            return;
        }

        let valorFuncion;

        try {
            valorFuncion = funcionActual(posicionPuntoSeleccionadoX);
        } catch (error) {
            valorFuncion = NaN;
        }

        const pendiente = pendienteNumericaEn(posicionPuntoSeleccionadoX);

        if (
            !Number.isFinite(valorFuncion)
        ) {
            mostrarMensajeResultado(
                describirProblemaMatematicoEn(posicionPuntoSeleccionadoX)
            );
            return;
        }

        if (!Number.isFinite(pendiente)) {
            mostrarMensajeResultado(
                "No hay recta tangente válida en el punto seleccionado."
            );
            return;
        }

        const recta = textoRectaTangentePanel(
            posicionPuntoSeleccionadoX,
            valorFuncion,
            pendiente
        );

        mostrarEnResultado(
            "tangente|" + recta.explicita + "|" + recta.puntoPendiente,
            () => [
                crearLineaResultado([
                    crearTextoMatematico(recta.explicita, "resultado-ecuacion")
                ]),
                crearLineaResultado([
                    crearTextoMatematico(
                        recta.puntoPendiente,
                        "resultado-ecuacion resultado-ecuacion-secundaria"
                    )
                ])
            ]
        );
        return;
    }

    if (cantidadDedos === 3) {
        if (!arbolDerivadaActual || !arbolSegundaDerivadaActual) {
            mostrarMensajeResultado("Derivada no disponible");
            return;
        }

        mostrarResultadoDerivadasVisuales();
        return;
    }

    if (cantidadDedos === 4) {
        if (errorPuntosCriticosActuales) {
            mostrarMensajeResultado(errorPuntosCriticosActuales);
            return;
        }

        if (!puntosCriticosActuales.length) {
            mostrarMensajeResultado("No se encontraron puntos críticos.");
            return;
        }

        const puntos = puntosCriticosActuales.map(xCritico => {
            let valorFuncion;

            try {
                valorFuncion = funcionActual(xCritico);
            } catch (error) {
                valorFuncion = NaN;
            }

            return {
                x: formatearValorMostrar(xCritico),
                y: formatearValorMostrar(valorFuncion),
                tipo: clasificarPuntoCriticoPanel(xCritico)
            };
        });

        mostrarEnResultado(
            "criticos|" + JSON.stringify(puntos),
            () => crearLineaResultado(
                puntos.map(crearPuntoCriticoResultado),
                "resultado-lista"
            )
        );
        return;
    }

    if (cantidadDedos === 5) {
        if (
            !retoAplicadoSeleccionado ||
            posicionRetoAplicadoX === null
        ) {
            const tieneValorX = Boolean(valorEvaluacionX?.value.trim());
            mostrarMensajeResultado(tieneValorX
                ? modalidadControl === "manual"
                    ? "Presiona Reto aplicado para usar el valor actual de X."
                    : "Vuelve a realizar el gesto de cinco dedos para actualizar el reto."
                : "Escribe un valor de X para activar el reto aplicado."
            );
            return;
        }

        mostrarRetoAplicado(posicionRetoAplicadoX);
    }
}

function cerrarModalAdvertencia() {
    if (modalAdvertencia) {
        modalAdvertencia.hidden = true;
    }
}

function mostrarModalAdvertencia(titulo, mensaje) {
    if (!modalAdvertencia || !tituloAdvertencia || !mensajeAdvertencia) {
        return;
    }

    tituloAdvertencia.textContent = titulo;
    mensajeAdvertencia.textContent = mensaje;
    modalAdvertencia.hidden = false;
    document.getElementById("cerrarAdvertenciaX")?.focus();
}

function invalidarPuntoEvaluado() {
    puntoDerechaSeleccionado = false;
    posicionPuntoSeleccionadoX = null;
    posicionRetoAplicadoX = null;
    retoAplicadoSeleccionado = false;
    puntoDerechaVisible = false;
    tangenteDerechaVisible = false;
}

function evaluarPuntoActivo(mostrarError = true) {
    if (!funcionActual || !valorEvaluacionX) {
        return false;
    }

    const textoX = valorEvaluacionX.value.trim();
    if (textoX === "") {
        invalidarPuntoEvaluado();
        cerrarModalAdvertencia();
        return false;
    }

    const x = Number(textoX);
    if (!Number.isFinite(x)) {
        invalidarPuntoEvaluado();
        if (mostrarError) {
            mostrarModalAdvertencia(
                "VALOR NO VÁLIDO",
                "Ingresa un número real válido para x."
            );
        }
        return false;
    }

    if (funcionActual.variables.includes("y")) {
        invalidarPuntoEvaluado();
        if (mostrarError) {
            mostrarModalAdvertencia(
                "FUNCIÓN DE DOS VARIABLES",
                "La función activa también depende de y; no puede evaluarse como una función de x solamente."
            );
        }
        return false;
    }

    let valor;
    try {
        valor = funcionActual(x, 0);
    } catch (error) {
        invalidarPuntoEvaluado();
        if (mostrarError) {
            mostrarModalAdvertencia(
                "EXPRESIÓN NO INTERPRETABLE",
                "No se pudo interpretar la expresión activa. Comprueba su sintaxis e inténtalo de nuevo."
            );
        }
        return false;
    }

    if (!Number.isFinite(valor)) {
        invalidarPuntoEvaluado();
        if (mostrarError) {
            const problema = describirProblemaMatematicoEn(x);
            mostrarModalAdvertencia(
                problema ? "PUNTO NO DEFINIDO" : "RESULTADO NO VÁLIDO",
                problema
                    ? `La función f(x) = ${funcionTextoActual} no está definida en los números reales para x = ${textoX}. ${problema}`
                    : `No se obtuvo un resultado real finito para f(${textoX}).`
            );
        }
        return false;
    }

    cerrarModalAdvertencia();
    puntoDerechaSeleccionado = true;
    posicionPuntoSeleccionadoX = x;
    puntoDerechaVisible =
        cantidadDedosDerechaActual === 1 ||
        cantidadDedosDerechaActual === 2;
    tangenteDerechaVisible = cantidadDedosDerechaActual === 2;
    return true;
}

function actualizarPausaControlesManuales() {
    if (!botonPausarControlManual || !controlesManuales) {
        return;
    }

    botonPausarControlManual.textContent =
        interaccionManualPausada ? "Reanudar" : "Pausar";
    botonPausarControlManual.setAttribute(
        "aria-pressed",
        String(interaccionManualPausada)
    );

    controlesManuales
        .querySelectorAll("[data-manual-action]")
        .forEach(boton => {
            boton.disabled = interaccionManualPausada;
        });

    if (interaccionManualPausada && accion) {
        accion.textContent = "Interacción manual pausada";
    }
}

function cambiarModalidadControl(modalidad) {
    if (modalidad !== "gestos" && modalidad !== "manual") {
        return;
    }

    modalidadControl = modalidad;
    interaccionManualPausada = false;
    cantidadDedosDerechaActual = 0;
    puntoDerechaVisible = false;
    tangenteDerechaVisible = false;
    derivadaDerechaVisible = false;
    puntoCriticoDerechaVisible = false;
    retoAplicadoDerechaVisible = false;
    invalidarPuntoEvaluado();
    firmaPanelInteraccion = null;

    document.querySelectorAll("[data-control-mode]").forEach(boton => {
        const seleccionado = boton.dataset.controlMode === modalidad;
        boton.classList.toggle("is-selected", seleccionado);
        boton.setAttribute("aria-pressed", String(seleccionado));
    });

    if (controlesManuales) {
        controlesManuales.hidden = modalidad !== "manual";
    }

    if (gesto) {
        gesto.textContent = modalidad === "manual"
            ? "CONTROL MANUAL"
            : "ESPERANDO...";
    }

    if (modalidad === "manual" && accion) {
        accion.textContent = "Selecciona una interacción";
    }

    actualizarPausaControlesManuales();
    actualizarPanelesInteraccion(0);
    firmaGraficaSolicitada = null;
    actualizarGrafica();
}

function activarInteraccionManual(cantidadDedos) {
    if (
        modalidadControl !== "manual" ||
        interaccionManualPausada
    ) {
        return;
    }

    if (!funcionActual) {
        mostrarMensajeResultado(
            "Carga una función de una variable para ver el resultado."
        );
        return;
    }

    cantidadDedosDerechaActual = cantidadDedos;
    puntoDerechaVisible = cantidadDedos === 1 || cantidadDedos === 2;
    tangenteDerechaVisible = cantidadDedos === 2;
    derivadaDerechaVisible = cantidadDedos === 3;
    puntoCriticoDerechaVisible = cantidadDedos === 4;
    retoAplicadoDerechaVisible = cantidadDedos === 5;
    firmaPanelInteraccion = null;

    if (gesto) {
        gesto.textContent = `CONTROL MANUAL · ${cantidadDedos}`;
    }

    if (cantidadDedos === 1 || cantidadDedos === 2 || cantidadDedos === 5) {
        const puntoValido = evaluarPuntoActivo();
        if (cantidadDedos === 5 && puntoValido) {
            retoAplicadoSeleccionado = true;
            posicionRetoAplicadoX = posicionPuntoSeleccionadoX;
        }
    } else if (cantidadDedos === 3) {
        mostrarDerivadaActual();
    } else if (cantidadDedos === 4) {
        puntosCriticosActuales = calcularPuntosCriticosSeguro();
    }

    firmaPanelInteraccion = null;
    actualizarPanelesInteraccion(cantidadDedos);
    actualizarGrafica();
}

function insertarTextoEnFuncion(texto, desplazamientoCursor = texto.length) {
    if (!entradaFuncion) {
        return;
    }

    const inicio = entradaFuncion.selectionStart ?? entradaFuncion.value.length;
    const fin = entradaFuncion.selectionEnd ?? inicio;
    entradaFuncion.setRangeText(texto, inicio, fin, "end");
    entradaFuncion.focus();
    const posicionCursor = inicio + desplazamientoCursor;
    entradaFuncion.setSelectionRange(posicionCursor, posicionCursor);
    entradaFuncion.dispatchEvent(new Event("input", { bubbles: true }));
}

function cerrarPanelIngresoLog() {
    if (panelIngresoLog) {
        panelIngresoLog.hidden = true;
    }
    if (opcionesIngresoLog) {
        opcionesIngresoLog.hidden = false;
    }
    if (formularioBaseLog) {
        formularioBaseLog.hidden = true;
        formularioBaseLog.reset();
    }
    if (errorBaseLog) {
        errorBaseLog.textContent = "";
    }
}

function mostrarPanelIngresoLog() {
    if (!panelIngresoLog || !opcionesIngresoLog || !formularioBaseLog) {
        return;
    }

    opcionesIngresoLog.hidden = false;
    formularioBaseLog.hidden = true;
    panelIngresoLog.hidden = false;
    if (errorBaseLog) {
        errorBaseLog.textContent = "";
    }
}

function representarBaseComoSubindice(base) {
    const digitos = {
        "0": "₀",
        "1": "₁",
        "2": "₂",
        "3": "₃",
        "4": "₄",
        "5": "₅",
        "6": "₆",
        "7": "₇",
        "8": "₈",
        "9": "₉"
    };
    const texto = String(base);

    if (/^\d+$/.test(texto)) {
        return Array.from(texto, digito => digitos[digito]).join("");
    }

    return `₍${texto}₎`;
}

function actualizarEntradaEvaluacion() {
    invalidarPuntoEvaluado();
    cerrarModalAdvertencia();

    if ([1, 2, 5].includes(cantidadDedosDerechaActual)) {
        firmaPanelInteraccion = null;
        actualizarPanelesInteraccion(cantidadDedosDerechaActual);
    }

    actualizarGrafica();
}

document.querySelectorAll("[data-control-mode]").forEach(boton => {
    boton.addEventListener("click", () => {
        cambiarModalidadControl(boton.dataset.controlMode);
    });
});

controlesManuales?.addEventListener("click", evento => {
    const boton = evento.target instanceof Element
        ? evento.target.closest("[data-manual-action]")
        : null;
    if (boton && !boton.disabled) {
        activarInteraccionManual(Number(boton.dataset.manualAction));
    }
});

botonPausarControlManual?.addEventListener("click", () => {
    if (modalidadControl !== "manual") {
        return;
    }

    interaccionManualPausada = !interaccionManualPausada;
    actualizarPausaControlesManuales();
    if (!interaccionManualPausada) {
        firmaPanelInteraccion = null;
        actualizarPanelesInteraccion(cantidadDedosDerechaActual);
    }
});

valorEvaluacionX?.addEventListener("input", actualizarEntradaEvaluacion);
valorEvaluacionX?.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
        evento.preventDefault();
        actualizarEntradaEvaluacion();
    }
});

document.getElementById("cerrarAdvertenciaX")?.addEventListener(
    "click",
    cerrarModalAdvertencia
);
document.getElementById("cerrarAdvertencia")?.addEventListener(
    "click",
    cerrarModalAdvertencia
);
modalAdvertencia?.addEventListener("click", evento => {
    if (evento.target?.hasAttribute("data-cerrar-advertencia")) {
        cerrarModalAdvertencia();
    }
});

if (entradaFuncion && botonSimbolos && panelSimbolos) {
    function cerrarPanelSimbolos() {
        panelSimbolos.hidden = true;
        botonSimbolos.setAttribute("aria-expanded", "false");
    }

    botonSimbolos.addEventListener("mousedown", evento => {
        evento.preventDefault();
    });
    botonSimbolos.addEventListener("click", () => {
        const abierto = botonSimbolos.getAttribute("aria-expanded") === "true";
        panelSimbolos.hidden = abierto;
        botonSimbolos.setAttribute("aria-expanded", String(!abierto));
    });
    panelSimbolos.addEventListener("mousedown", evento => {
        if (evento.target instanceof Element && evento.target.closest(".symbol-key")) {
            evento.preventDefault();
        }
    });
    panelSimbolos.addEventListener("click", evento => {
        const destino = evento.target instanceof Element ? evento.target : null;
        const teclaLog = destino?.closest('[data-action="log"]');
        if (teclaLog) {
            cerrarPanelSimbolos();
            mostrarPanelIngresoLog();
            return;
        }

        const tecla = destino?.closest("[data-insert]");
        if (tecla) {
            insertarTextoEnFuncion(
                tecla.dataset.insert,
                Number(tecla.dataset.caretOffset) || tecla.dataset.insert.length
            );
            return;
        }

        if (destino?.closest(".symbol-panel-close")) {
            cerrarPanelSimbolos();
            botonSimbolos.focus();
        }
    });
    document.addEventListener("pointerdown", evento => {
        if (
            !panelSimbolos.hidden &&
            !panelSimbolos.contains(evento.target) &&
            evento.target !== botonSimbolos
        ) {
            cerrarPanelSimbolos();
        }
    });
    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !panelSimbolos.hidden) {
            cerrarPanelSimbolos();
            botonSimbolos.focus();
        }
    });
}

panelIngresoLog?.addEventListener("click", evento => {
    const destino = evento.target instanceof Element ? evento.target : null;
    const boton = destino?.closest("[data-log-choice]");
    if (!boton) {
        return;
    }

    const eleccion = boton.dataset.logChoice;
    if (eleccion === "cancelar") {
        cerrarPanelIngresoLog();
    } else if (eleccion === "sin-base") {
        insertarTextoEnFuncion("log()", 4);
        cerrarPanelIngresoLog();
    } else if (eleccion === "base" && opcionesIngresoLog && formularioBaseLog) {
        opcionesIngresoLog.hidden = true;
        formularioBaseLog.hidden = false;
        baseLog?.focus();
    }
});

formularioBaseLog?.addEventListener("submit", evento => {
    evento.preventDefault();
    const base = Number(baseLog?.value);
    if (!Number.isFinite(base) || base <= 0 || base === 1) {
        if (errorBaseLog) {
            errorBaseLog.textContent = "La base debe ser mayor que cero y distinta de 1.";
        }
        baseLog?.focus();
        return;
    }

    const notacion = `log${representarBaseComoSubindice(base)}()`;
    insertarTextoEnFuncion(notacion, notacion.indexOf("(") + 1);
    cerrarPanelIngresoLog();
});

document.addEventListener("pointerdown", evento => {
    if (
        panelIngresoLog &&
        !panelIngresoLog.hidden &&
        !panelIngresoLog.contains(evento.target) &&
        !panelSimbolos?.contains(evento.target)
    ) {
        cerrarPanelIngresoLog();
    }
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && panelIngresoLog && !panelIngresoLog.hidden) {
        cerrarPanelIngresoLog();
    }
});

function calcularPuntosCriticos() {
    if (!funcionActual || esFuncionDosVariables(funcionActual)) {
        return [];
    }

    const arbol = parsearExpresion(funcionTextoActual);
    const arbolDerivada = simplificarArbolMatematico(
        derivarArbolMatematico(arbol)
    );
    const funcionDerivada = crearFuncionEvaluable(arbolDerivada);
    const puntos = [];
    const minimo = -10;
    const maximo = 10;
    const muestras = 800;
    const paso = (maximo - minimo) / muestras;
    const evaluarDerivada = x => {
        try {
            const valor = funcionDerivada(x);
            return Number.isFinite(valor) ? valor : null;
        } catch (error) {
            return null;
        }
    };
    const signosOpuestos = (a, b) =>
        (a < 0 && b > 0) || (a > 0 && b < 0);
    const agregarPunto = punto => {
        let valorFuncion;
        try {
            valorFuncion = funcionActual(punto);
        } catch (error) {
            return;
        }

        if (
            punto < minimo ||
            punto > maximo ||
            !Number.isFinite(valorFuncion) ||
            puntos.some(existente => Math.abs(existente - punto) < 1e-3)
        ) {
            return;
        }

        const pasoClasificacion = Math.max(1e-5, paso / 4);
        const derivadaIzquierda = evaluarDerivada(punto - pasoClasificacion);
        const derivadaDerecha = evaluarDerivada(punto + pasoClasificacion);

        if (
            derivadaIzquierda === null ||
            derivadaDerecha === null ||
            !signosOpuestos(derivadaIzquierda, derivadaDerecha)
        ) {
            return;
        }

        puntos.push(punto);
    };
    const refinarRaiz = (izquierdaInicial, derechaInicial, valorIzquierda) => {
        let izquierda = izquierdaInicial;
        let derecha = derechaInicial;
        let derivadaIzquierda = valorIzquierda;

        for (let iteracion = 0; iteracion < 50; iteracion++) {
            const medio = (izquierda + derecha) / 2;
            const derivadaMedia = evaluarDerivada(medio);

            if (derivadaMedia === null) {
                return null;
            }

            if (derivadaMedia === 0) {
                return medio;
            }

            if (signosOpuestos(derivadaIzquierda, derivadaMedia)) {
                derecha = medio;
            } else {
                izquierda = medio;
                derivadaIzquierda = derivadaMedia;
            }
        }

        return (izquierda + derecha) / 2;
    };

    let muestrasFuncionValidas = 0;
    let muestrasDerivadaValidas = 0;
    let anterior = null;

    for (let indice = 0; indice <= muestras; indice++) {
        const x = minimo + indice * paso;
        let valorFuncion;
        try {
            valorFuncion = funcionActual(x);
        } catch (error) {
            anterior = null;
            continue;
        }

        if (!Number.isFinite(valorFuncion)) {
            anterior = null;
            continue;
        }

        muestrasFuncionValidas++;
        const derivada = evaluarDerivada(x);

        if (derivada === null) {
            anterior = null;
            continue;
        }

        muestrasDerivadaValidas++;

        if (anterior) {
            if (
                anterior.derivada !== 0 &&
                derivada !== 0 &&
                signosOpuestos(anterior.derivada, derivada)
            ) {
                const raiz = refinarRaiz(
                    anterior.x,
                    x,
                    anterior.derivada
                );
                if (raiz !== null) {
                    agregarPunto(raiz);
                }
            } else if (derivada === 0 && anterior.derivada !== 0) {
                agregarPunto(x);
            } else if (anterior.derivada === 0 && derivada !== 0) {
                agregarPunto(anterior.x);
            }
        } else if (derivada === 0) {
            agregarPunto(x);
        }

        anterior = { x, derivada };
    }

    if (muestrasFuncionValidas === 0) {
        throw new Error(
            "La función no tiene valores reales en el intervalo analizado."
        );
    }

    if (muestrasDerivadaValidas === 0) {
        throw new Error(
            "No se pudieron evaluar muestras reales de la derivada."
        );
    }

    return puntos.sort((a, b) => a - b);
}

function calcularPuntosCriticosSeguro() {
    errorPuntosCriticosActuales = "";

    try {
        return calcularPuntosCriticos();
    } catch (error) {
        console.error("Error analizando puntos críticos:", error);
        errorPuntosCriticosActuales =
            "No se pudo completar el análisis de puntos críticos. " +
            "Revisa el dominio de la función e inténtalo de nuevo.";
        return [];
    }
}

/* =====================================================
   MOSTRAR FUNCIÓN MATEMÁTICA
===================================================== */

function mostrarFuncionExacta(texto) {

    if (!funcionActiva) {
        return;
    }

    try {
        funcionActiva.replaceChildren(
            renderizarExpresionMatematica(
                parsearExpresion(texto)
            )
        );
    } catch (error) {
        funcionActiva.textContent = texto;
    }
}


/* =====================================================
   CALCULAR DOMINIO REAL
===================================================== */

function crearIntervalo(inicio, fin, incluyeInicio = false, incluyeFin = false) {

    return {
        inicio,
        fin,
        incluyeInicio,
        incluyeFin
    };
}

const dominioReal = [
    crearIntervalo(null, null, false, false)
];

function compararNumeros(a, b) {

    if (a === b) {
        return 0;
    }

    return a < b ? -1 : 1;
}

function puntoEnIntervalo(punto, intervalo) {

    const superaInicio =
        intervalo.inicio === null ||
        punto > intervalo.inicio ||
        (punto === intervalo.inicio && intervalo.incluyeInicio);

    const antesFin =
        intervalo.fin === null ||
        punto < intervalo.fin ||
        (punto === intervalo.fin && intervalo.incluyeFin);

    return superaInicio && antesFin;
}

function intersecarIntervalos(primeros, segundos) {

    const resultado = [];

    for (const primero of primeros) {
        for (const segundo of segundos) {
            const inicio =
                primero.inicio === null
                    ? segundo.inicio
                    : segundo.inicio === null
                        ? primero.inicio
                        : Math.max(primero.inicio, segundo.inicio);

            const fin =
                primero.fin === null
                    ? segundo.fin
                    : segundo.fin === null
                        ? primero.fin
                        : Math.min(primero.fin, segundo.fin);

            const incluyeInicio =
                puntoEnIntervalo(inicio, primero) &&
                puntoEnIntervalo(inicio, segundo);

            const incluyeFin =
                puntoEnIntervalo(fin, primero) &&
                puntoEnIntervalo(fin, segundo);

            if (
                inicio === null ||
                fin === null ||
                inicio < fin ||
                (inicio === fin && incluyeInicio && incluyeFin)
            ) {
                resultado.push(
                    crearIntervalo(
                        inicio,
                        fin,
                        incluyeInicio,
                        incluyeFin
                    )
                );
            }
        }
    }

    return unirIntervalos(resultado);
}

function unirIntervalos(intervalos) {

    const ordenados = [...intervalos].sort((a, b) => {
        if (a.inicio === null) {
            return -1;
        }

        if (b.inicio === null) {
            return 1;
        }

        return compararNumeros(a.inicio, b.inicio);
    });

    const resultado = [];

    for (const intervalo of ordenados) {
        const anterior = resultado[resultado.length - 1];

        if (!anterior) {
            resultado.push(intervalo);
            continue;
        }

        const seTocan =
            anterior.fin === null ||
            intervalo.inicio === null ||
            anterior.fin > intervalo.inicio ||
            (
                anterior.fin === intervalo.inicio &&
                (anterior.incluyeFin || intervalo.incluyeInicio)
            );

        if (!seTocan) {
            resultado.push(intervalo);
            continue;
        }

        const usarFinNuevo =
            anterior.fin !== null &&
            (
                intervalo.fin === null ||
                intervalo.fin > anterior.fin
            );

        if (usarFinNuevo) {
            anterior.fin = intervalo.fin;
            anterior.incluyeFin = intervalo.incluyeFin;
        } else if (
            intervalo.fin === anterior.fin
        ) {
            anterior.incluyeFin =
                anterior.incluyeFin || intervalo.incluyeFin;
        }

        if (
            anterior.inicio === intervalo.inicio &&
            intervalo.incluyeInicio
        ) {
            anterior.incluyeInicio = true;
        }
    }

    console.log("DOMINIO - intervalos antes de unir:", intervalos);

    const intervalosUnidos = resultado;

    console.log("DOMINIO - intervalos después de unir:", intervalosUnidos);

    return intervalosUnidos;
}

function obtenerPolinomio(nodo) {

    if (nodo.tipo === "numero") {
        return [nodo.valor];
    }

    if (nodo.tipo === "constante") {
        if (nodo.nombre === "x") {
            return [0, 1];
        }

        return [nodo.nombre === "pi" ? Math.PI : Math.E];
    }

    if (nodo.tipo === "unario") {
        const polinomio = obtenerPolinomio(nodo.argumento);

        if (!polinomio) {
            return null;
        }

        return nodo.operador === "-"
            ? polinomio.map(valor => -valor)
            : polinomio;
    }

    if (nodo.tipo !== "binario") {
        return null;
    }

    const izquierdo = obtenerPolinomio(nodo.izquierdo);
    const derecho = obtenerPolinomio(nodo.derecho);

    if (!izquierdo || !derecho) {
        return null;
    }

    if (
        nodo.operador === "+" ||
        nodo.operador === "-"
    ) {
        const signo = nodo.operador === "+" ? 1 : -1;
        const longitud = Math.max(
            izquierdo.length,
            derecho.length
        );
        const resultado = Array(longitud).fill(0);

        for (let i = 0; i < longitud; i++) {
            resultado[i] =
                (izquierdo[i] || 0) +
                signo * (derecho[i] || 0);
        }

        return resultado;
    }

    if (nodo.operador === "*") {
        const resultado = Array(
            izquierdo.length + derecho.length - 1
        ).fill(0);

        for (let i = 0; i < izquierdo.length; i++) {
            for (let j = 0; j < derecho.length; j++) {
                resultado[i + j] +=
                    izquierdo[i] * derecho[j];
            }
        }

        return resultado.length <= 3
            ? resultado
            : null;
    }

    if (nodo.operador === "/") {
        if (derecho.length !== 1 || derecho[0] === 0) {
            return null;
        }

        return izquierdo.map(valor => valor / derecho[0]);
    }

    if (nodo.operador === "^") {
        if (
            derecho.length !== 1 ||
            !Number.isInteger(derecho[0]) ||
            derecho[0] < 0 ||
            derecho[0] > 2
        ) {
            return null;
        }

        const base = izquierdo;
        let resultado = [1];

        for (let i = 0; i < derecho[0]; i++) {
            const producto = Array(
                resultado.length + base.length - 1
            ).fill(0);

            for (let j = 0; j < resultado.length; j++) {
                for (let k = 0; k < base.length; k++) {
                    producto[j + k] +=
                        resultado[j] * base[k];
                }
            }

            resultado = producto;
        }

        return resultado.length <= 3
            ? resultado
            : null;
    }

    return null;
}

function evaluarPolinomio(polinomio, valor) {

    return polinomio.reduceRight(
        (resultado, coeficiente) =>
            resultado * valor + coeficiente,
        0
    );
}

function encontrarRaicesPolinomio(polinomio) {

    const coeficientes = [...polinomio];

    while (
        coeficientes.length > 1 &&
        Math.abs(coeficientes[coeficientes.length - 1]) < 1e-12
    ) {
        coeficientes.pop();
    }

    const grado = coeficientes.length - 1;

    if (grado === 0) {
        return [];
    }

    if (grado === 1) {
        return [-coeficientes[0] / coeficientes[1]];
    }

    if (grado === 2) {
        const a = coeficientes[2];
        const b = coeficientes[1];
        const c = coeficientes[0];
        const discriminante = b * b - 4 * a * c;

        if (discriminante < 0) {
            return [];
        }

        if (Math.abs(discriminante) < 1e-12) {
            return [-b / (2 * a)];
        }

        const raiz = Math.sqrt(discriminante);
        return [
            (-b - raiz) / (2 * a),
            (-b + raiz) / (2 * a)
        ];
    }

    return null;
}

function resolverRestriccionPolinomial(polinomio, operador) {

    const raices = encontrarRaicesPolinomio(polinomio);

    if (raices === null) {
        return dominioReal;
    }

    const puntos = [...new Set(raices)].sort((a, b) => a - b);
    const limites = [null, ...puntos, null];
    const resultado = [];

    const cumple = valor => {
        const evaluacion = evaluarPolinomio(polinomio, valor);

        if (operador === "distinto") {
            return Math.abs(evaluacion) > 1e-9;
        }

        return operador === "mayor"
            ? evaluacion > 1e-9
            : evaluacion >= -1e-9;
    };

    for (let i = 0; i < limites.length - 1; i++) {
        const inicio = limites[i];
        const fin = limites[i + 1];
        const muestra =
            inicio === null
                ? fin - 1
                : fin === null
                    ? inicio + 1
                    : (inicio + fin) / 2;

        if (cumple(muestra)) {
            resultado.push(
                crearIntervalo(
                    inicio,
                    fin,
                    false,
                    false
                )
            );
        }
    }

    if (operador !== "distinto") {
        for (const punto of puntos) {
            if (cumple(punto)) {
                resultado.push(
                    crearIntervalo(
                        punto,
                        punto,
                        true,
                        true
                    )
                );
            }
        }
    }

    return unirIntervalos(resultado);
}

function analizarRestriccionesDominio(nodo) {

    if (
        nodo.tipo === "numero" ||
        nodo.tipo === "constante"
    ) {
        return {
            intervalos: dominioReal,
            tangentes: []
        };
    }

    if (nodo.tipo === "unario") {
        return analizarRestriccionesDominio(nodo.argumento);
    }

    if (nodo.tipo === "funcion") {
        const argumento = analizarRestriccionesDominio(
            nodo.argumento
        );
        let intervalos = argumento.intervalos;
        const tangentes = [...argumento.tangentes];
        const polinomio = obtenerPolinomio(nodo.argumento);

        if (
            nodo.nombre === "sqrt" ||
            nodo.nombre === "ln" ||
            nodo.nombre === "log"
        ) {
            if (polinomio) {
                console.log("DOMINIO - AST argumento:", nodo.argumento);
                console.log("DOMINIO - polinomio argumento:", polinomio);

                intervalos = intersecarIntervalos(
                    intervalos,
                    resolverRestriccionPolinomial(
                        polinomio,
                        nodo.nombre === "sqrt"
                            ? "mayorIgual"
                            : "mayor"
                    )
                );

                console.log("DOMINIO - restricción aplicada:",
                    nodo.nombre === "sqrt"
                        ? "argumento >= 0"
                        : "argumento > 0"
                );
            }
        }

        if (
            nodo.nombre === "tan" ||
            nodo.nombre === "sec" ||
            nodo.nombre === "csc" ||
            nodo.nombre === "cot"
        ) {
            tangentes.push({
                funcion: nodo.nombre,
                argumento: nodo.argumento
            });
        }

        return {
            intervalos,
            tangentes
        };
    }

    if (nodo.tipo === "binario") {
        const izquierdo = analizarRestriccionesDominio(
            nodo.izquierdo
        );
        const derecho = analizarRestriccionesDominio(
            nodo.derecho
        );
        let intervalos = intersecarIntervalos(
            izquierdo.intervalos,
            derecho.intervalos
        );

        if (nodo.operador === "/") {
            const polinomioDenominador = obtenerPolinomio(
                nodo.derecho
            );

            if (polinomioDenominador) {
                intervalos = intersecarIntervalos(
                    intervalos,
                    resolverRestriccionPolinomial(
                        polinomioDenominador,
                        "distinto"
                    )
                );
            }
        }

        return {
            intervalos,
            tangentes: [
                ...izquierdo.tangentes,
                ...derecho.tangentes
            ]
        };
    }

    return {
        intervalos: dominioReal,
        tangentes: []
    };
}

function formatearNumeroDominio(numero) {

    if (Object.is(numero, -0) || Math.abs(numero) < 1e-10) {
        return "0";
    }

    return Number.isInteger(numero)
        ? String(numero)
        : String(Number(numero.toFixed(6)));
}

function formatearIntervalosDominio(intervalos) {

    if (intervalos.length === 0) {
        return "∅";
    }

    const esTodoReal =
        intervalos.length === 1 &&
        intervalos[0].inicio === null &&
        intervalos[0].fin === null;

    if (esTodoReal) {
        return "ℝ";
    }

    return intervalos.map(intervalo => {
        const inicio = intervalo.inicio === null
            ? "-∞"
            : formatearNumeroDominio(intervalo.inicio);
        const fin = intervalo.fin === null
            ? "∞"
            : formatearNumeroDominio(intervalo.fin);
        const abre =
            intervalo.inicio === null || !intervalo.incluyeInicio
                ? "("
                : "[";
        const cierra =
            intervalo.fin === null || !intervalo.incluyeFin
                ? ")"
                : "]";

        return `${abre}${inicio}, ${fin}${cierra}`;
    }).join(" ∪ ");
}

function describirRestriccionTrigonometrica(restriccion) {

    const funcion = restriccion.funcion;
    const nodo = restriccion.argumento;

    if (funcion === "csc" || funcion === "cot") {
        if (
            nodo.tipo === "constante" &&
            nodo.nombre === "x"
        ) {
            return "{kπ, k ∈ ℤ}";
        }

        return "{x : sin(argumento) = 0}";
    }

    if (
        nodo.tipo === "constante" &&
        nodo.nombre === "x"
    ) {
        return "{π/2 + kπ, k ∈ ℤ}";
    }

    return "{x : cos(argumento) = 0}";
}

function dominioDeterminableConLogicaActual(nodo) {
    if (
        nodo.tipo === "numero" ||
        nodo.tipo === "constante"
    ) {
        return true;
    }

    if (nodo.tipo === "unario") {
        return dominioDeterminableConLogicaActual(
            nodo.argumento
        );
    }

    if (nodo.tipo === "funcion") {
        if (
            !dominioDeterminableConLogicaActual(
                nodo.argumento
            )
        ) {
            return false;
        }

        return (
            nodo.nombre !== "sqrt" &&
            nodo.nombre !== "ln" &&
            nodo.nombre !== "log"
        ) || Boolean(obtenerPolinomio(nodo.argumento));
    }

    if (nodo.tipo !== "binario") {
        return false;
    }

    if (
        !dominioDeterminableConLogicaActual(nodo.izquierdo) ||
        !dominioDeterminableConLogicaActual(nodo.derecho)
    ) {
        return false;
    }

    if (nodo.operador === "/") {
        if (obtenerPolinomio(nodo.derecho)) {
            return true;
        }

        if (obtenerVariablesDelArbol(nodo.derecho).length > 0) {
            return false;
        }

        try {
            const denominador = evaluarArbolMatematico(
                nodo.derecho,
                0,
                0
            );
            return Number.isFinite(denominador) && denominador !== 0;
        } catch (error) {
            return false;
        }
    }

    if (nodo.operador === "^") {
        const exponente = obtenerPolinomio(nodo.derecho);

        return Boolean(
            exponente &&
            exponente.length === 1 &&
            Number.isInteger(exponente[0]) &&
            exponente[0] >= 0
        );
    }

    return true;
}

function calcularDominio(texto) {

    try {
        console.log("DOMINIO - expresión original:", texto);

        const tokens = tokenizarExpresion(texto);
        console.log("DOMINIO - tokens:", tokens);

        const arbol = parsearExpresion(texto);
        console.log("DOMINIO - AST:", arbol);

        if (!dominioDeterminableConLogicaActual(arbol)) {
            return "No determinado automáticamente";
        }

        const restricciones = analizarRestriccionesDominio(arbol);
        console.log("DOMINIO - restricciones:", restricciones);

        const intervalos = restricciones.intervalos;
        console.log("DOMINIO - intervalos:", intervalos);

        const dominioTexto = formatearIntervalosDominio(intervalos);
        let resultado;

        if (restricciones.tangentes.length === 0) {
            resultado = dominioTexto;
            console.log("DOMINIO - resultado:", resultado);
            return resultado;
        }

        const restriccionesTangente = restricciones.tangentes
            .map(describirRestriccionTrigonometrica)
            .join(", ");

        if (dominioTexto === "ℝ") {
            resultado = `ℝ − ${restriccionesTangente}`;
            console.log("DOMINIO - resultado:", resultado);
            return resultado;
        }

        resultado = `${dominioTexto} ∩ (ℝ − ${restriccionesTangente})`;
        console.log("DOMINIO - resultado:", resultado);
        return resultado;

    } catch (error) {
        console.error("Error calculando dominio:", error);
        return "No definido";
    }
}

function calcularRango(texto) {

    try {
        const arbol = parsearExpresion(texto);
        const polinomio = obtenerPolinomio(arbol);

        if (!polinomio) {
            return "No determinado automáticamente";
        }

        const coeficientes = [...polinomio];

        while (
            coeficientes.length > 1 &&
            Math.abs(coeficientes[coeficientes.length - 1]) < 1e-12
        ) {
            coeficientes.pop();
        }

        const grado = coeficientes.length - 1;

        if (grado === 0) {
            const valor = coeficientes[0];
            return Number.isFinite(valor)
                ? `{${formatearNumeroDominio(valor)}}`
                : "No determinado automáticamente";
        }

        if (grado === 1) {
            return Math.abs(coeficientes[1]) > 1e-12
                ? "ℝ"
                : `{${formatearNumeroDominio(coeficientes[0])}}`;
        }

        if (grado === 2) {
            const a = coeficientes[2];
            const b = coeficientes[1];
            const c = coeficientes[0];

            if (Math.abs(a) < 1e-12) {
                return Math.abs(b) > 1e-12
                    ? "ℝ"
                    : `{${formatearNumeroDominio(c)}}`;
            }

            const valorVertice = c - (b * b) / (4 * a);

            if (!Number.isFinite(valorVertice)) {
                return "No determinado automáticamente";
            }

            const valorTexto = formatearNumeroDominio(valorVertice);

            return a > 0
                ? `[${valorTexto}, ∞)`
                : `(-∞, ${valorTexto}]`;
        }

    } catch (error) {
        return "No determinado automáticamente";
    }

    return "No determinado automáticamente";
}

function obtenerDiscontinuidadesRacionales(texto) {
    try {
        const arbol = parsearExpresion(texto);
        const discontinuidades = [];

        const recorrer = nodo => {
            if (nodo.tipo === "unario" || nodo.tipo === "funcion") {
                recorrer(nodo.argumento);
                return;
            }

            if (nodo.tipo !== "binario") {
                return;
            }

            recorrer(nodo.izquierdo);
            recorrer(nodo.derecho);

            if (nodo.operador !== "/") {
                return;
            }

            const denominador = obtenerPolinomio(nodo.derecho);
            const raices = denominador
                ? encontrarRaicesPolinomio(denominador)
                : null;

            if (raices) {
                discontinuidades.push(
                    ...raices.filter(Number.isFinite)
                );
            }
        };

        recorrer(arbol);

        return [...new Set(
            discontinuidades.map(valor => valor.toFixed(10))
        )].map(Number);
    } catch (error) {
        return [];
    }
}

function esFuncionDosVariables(funcion) {

    return Boolean(
        funcion &&
        funcion.variables &&
        funcion.variables.includes("y")
    );
}

function actualizarTamanoSuperficie3D() {

    if (
        !renderizadorSuperficie3D ||
        !camaraSuperficie3D ||
        !canvasSuperficie3D
    ) {
        return;
    }

    const ancho = canvasSuperficie3D.clientWidth;
    const alto = canvasSuperficie3D.clientHeight;

    if (ancho <= 0 || alto <= 0) {
        return;
    }

    renderizadorSuperficie3D.setSize(
        ancho,
        alto,
        false
    );

    camaraSuperficie3D.aspect = ancho / alto;
    camaraSuperficie3D.updateProjectionMatrix();
}

function actualizarSuperficie3D(funcion) {

    if (
        !THREE ||
        !escenaSuperficie3D ||
        !renderizadorSuperficie3D ||
        !funcion
    ) {
        return;
    }

    const segmentos = 50;
    const minimo = -5;
    const maximo = 5;
    const paso = (maximo - minimo) / segmentos;
    const posiciones = [];
    const validos = [];

    for (let fila = 0; fila <= segmentos; fila++) {
        const y = minimo + fila * paso;

        for (let columna = 0; columna <= segmentos; columna++) {
            const x = minimo + columna * paso;
            const z = funcion(x, y);
            const valido = Number.isFinite(z);

            posiciones.push(
                x,
                valido ? z : 0,
                y
            );
            validos.push(valido);
        }
    }

    const indices = [];
    const posicionesLineas = [];
    const anchoMalla = segmentos + 1;

    const agregarLinea = (primero, segundo) => {
        if (!validos[primero] || !validos[segundo]) {
            return;
        }

        posicionesLineas.push(
            posiciones[primero * 3],
            posiciones[primero * 3 + 1],
            posiciones[primero * 3 + 2],
            posiciones[segundo * 3],
            posiciones[segundo * 3 + 1],
            posiciones[segundo * 3 + 2]
        );
    };

    for (let fila = 0; fila < segmentos; fila++) {
        for (let columna = 0; columna < segmentos; columna++) {
            const superiorIzquierdo = fila * anchoMalla + columna;
            const superiorDerecho = superiorIzquierdo + 1;
            const inferiorIzquierdo = superiorIzquierdo + anchoMalla;
            const inferiorDerecho = inferiorIzquierdo + 1;

            agregarLinea(superiorIzquierdo, superiorDerecho);
            agregarLinea(superiorIzquierdo, inferiorIzquierdo);

            if (
                validos[superiorIzquierdo] &&
                validos[inferiorIzquierdo] &&
                validos[superiorDerecho]
            ) {
                indices.push(
                    superiorIzquierdo,
                    inferiorIzquierdo,
                    superiorDerecho
                );
            }

            if (
                validos[superiorDerecho] &&
                validos[inferiorIzquierdo] &&
                validos[inferiorDerecho]
            ) {
                indices.push(
                    superiorDerecho,
                    inferiorIzquierdo,
                    inferiorDerecho
                );
            }
        }
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(posiciones, 3)
    );
    geometria.setIndex(indices);
    geometria.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x087f9f,
        roughness: 0.72,
        metalness: 0.1,
        side: THREE.DoubleSide,
        wireframe: false
    });

    const geometriaLineas = new THREE.BufferGeometry();
    geometriaLineas.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(posicionesLineas, 3)
    );

    const materialLineas = new THREE.LineBasicMaterial({
        color: 0x9ff6ff,
        transparent: false,
        opacity: 1,
        linewidth: 1.5
    });

    if (mallaSuperficie3D) {
        mallaSuperficie3D.geometry.dispose();
        mallaSuperficie3D.material.dispose();
        escenaSuperficie3D.remove(mallaSuperficie3D);
    }

    if (lineasSuperficie3D) {
        lineasSuperficie3D.geometry.dispose();
        lineasSuperficie3D.material.dispose();
        escenaSuperficie3D.remove(lineasSuperficie3D);
    }

    mallaSuperficie3D = new THREE.Mesh(
        geometria,
        material
    );

    escenaSuperficie3D.add(mallaSuperficie3D);

    lineasSuperficie3D = new THREE.LineSegments(
        geometriaLineas,
        materialLineas
    );

    escenaSuperficie3D.add(lineasSuperficie3D);
    renderizadorSuperficie3D.render(
        escenaSuperficie3D,
        camaraSuperficie3D
    );
}

function actualizarInteraccionSuperficie3D() {

    if (
        !renderizadorSuperficie3D ||
        !escenaSuperficie3D ||
        !camaraSuperficie3D ||
        !mallaSuperficie3D
    ) {
        return;
    }

    rotacionX +=
        (rotacionXObjetivo - rotacionX) * 0.12;

    rotacionY +=
        (rotacionYObjetivo - rotacionY) * 0.12;

    escalaGrafica +=
        (escalaGraficaObjetivo - escalaGrafica) * 0.12;

    if (
        Math.abs(mallaSuperficie3D.rotation.x - rotacionX) < 0.0001 &&
        Math.abs(mallaSuperficie3D.rotation.y - rotacionY) < 0.0001 &&
        Math.abs(mallaSuperficie3D.scale.x - escalaGrafica) < 0.0001
    ) {
        return;
    }

    mallaSuperficie3D.rotation.x = rotacionX;
    mallaSuperficie3D.rotation.y = rotacionY;
    mallaSuperficie3D.scale.setScalar(escalaGrafica);

    if (lineasSuperficie3D) {
        lineasSuperficie3D.rotation.x = rotacionX;
        lineasSuperficie3D.rotation.y = rotacionY;
        lineasSuperficie3D.scale.setScalar(escalaGrafica);
    }

    renderizadorSuperficie3D.render(
        escenaSuperficie3D,
        camaraSuperficie3D
    );
}

async function iniciarSuperficie3D() {

    if (!canvasSuperficie3D) {
        return;
    }

    try {
        THREE = await import(
            "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
        );

        escenaSuperficie3D = new THREE.Scene();
        camaraSuperficie3D = new THREE.PerspectiveCamera(
            45,
            1,
            0.1,
            100
        );
        camaraSuperficie3D.position.set(8, 7, 8);
        camaraSuperficie3D.lookAt(0, 0, 0);

        renderizadorSuperficie3D = new THREE.WebGLRenderer({
            canvas: canvasSuperficie3D,
            alpha: true,
            antialias: true
        });
        renderizadorSuperficie3D.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        const luzDireccional = new THREE.DirectionalLight(
            0xffffff,
            2.2
        );
        luzDireccional.position.set(4, 7, 5);
        escenaSuperficie3D.add(luzDireccional);
        escenaSuperficie3D.add(
            new THREE.AmbientLight(0xffffff, 0.8)
        );
        escenaSuperficie3D.add(
            new THREE.AxesHelper(3)
        );

        actualizarTamanoSuperficie3D();

        if (esFuncionDosVariables(funcionActual)) {
            actualizarSuperficie3D(funcionActual);
        }
    } catch (error) {
        console.error("No se pudo iniciar la superficie 3D:", error);
    }
}

function obtenerDiscontinuidadesTrigonométricas(texto, xMinimo, xMaximo) {
    try {
        const arbol = parsearExpresion(texto);
        const discontinuidades = [];

        const obtenerFormaLineal = nodo => {
            if (nodo.tipo === "numero") {
                return [0, nodo.valor];
            }

            if (nodo.tipo === "constante") {
                if (nodo.nombre === "x") {
                    return [1, 0];
                }
                if (nodo.nombre === "pi") {
                    return [0, Math.PI];
                }
                if (nodo.nombre === "e") {
                    return [0, Math.E];
                }
                return null;
            }

            if (nodo.tipo === "unario") {
                const forma = obtenerFormaLineal(nodo.argumento);
                return forma
                    ? nodo.operador === "-"
                        ? [-forma[0], -forma[1]]
                        : forma
                    : null;
            }

            if (nodo.tipo !== "binario") {
                return null;
            }

            const izquierdo = obtenerFormaLineal(nodo.izquierdo);
            const derecho = obtenerFormaLineal(nodo.derecho);
            if (!izquierdo || !derecho) {
                return null;
            }

            if (nodo.operador === "+" || nodo.operador === "-") {
                const signo = nodo.operador === "+" ? 1 : -1;
                return [
                    izquierdo[0] + signo * derecho[0],
                    izquierdo[1] + signo * derecho[1]
                ];
            }

            if (nodo.operador === "*") {
                if (izquierdo[0] === 0) {
                    return [
                        derecho[0] * izquierdo[1],
                        derecho[1] * izquierdo[1]
                    ];
                }
                if (derecho[0] === 0) {
                    return [
                        izquierdo[0] * derecho[1],
                        izquierdo[1] * derecho[1]
                    ];
                }
                return null;
            }

            if (nodo.operador === "/" && derecho[0] === 0 && derecho[1] !== 0) {
                return [
                    izquierdo[0] / derecho[1],
                    izquierdo[1] / derecho[1]
                ];
            }

            return null;
        };

        const recorrer = nodo => {
            if (nodo.tipo === "funcion") {
                if (["tan", "sec", "csc", "cot"].includes(nodo.nombre)) {
                    const forma = obtenerFormaLineal(nodo.argumento);
                    if (forma && Math.abs(forma[0]) > 1e-12) {
                        const [pendiente, intercepto] = forma;
                        const valorInicial =
                            pendiente * xMinimo + intercepto;
                        const valorFinal =
                            pendiente * xMaximo + intercepto;
                        const minimo = Math.min(valorInicial, valorFinal);
                        const maximo = Math.max(valorInicial, valorFinal);
                        const desplazamiento =
                            nodo.nombre === "tan" || nodo.nombre === "sec"
                                ? 0.5
                                : 0;
                        const primerIndice =
                            Math.ceil(minimo / Math.PI - desplazamiento);
                        const ultimoIndice =
                            Math.floor(maximo / Math.PI - desplazamiento);

                        for (
                            let indice = primerIndice;
                            indice <= ultimoIndice &&
                                indice - primerIndice < 10000;
                            indice++
                        ) {
                            const argumento =
                                (indice + desplazamiento) * Math.PI;
                            const x = (argumento - intercepto) / pendiente;
                            if (x >= xMinimo && x <= xMaximo) {
                                discontinuidades.push(x);
                            }
                        }
                    }
                }
                recorrer(nodo.argumento);
                return;
            }

            if (nodo.tipo === "unario") {
                recorrer(nodo.argumento);
            } else if (nodo.tipo === "binario") {
                recorrer(nodo.izquierdo);
                recorrer(nodo.derecho);
            }
        };

        recorrer(arbol);
        return discontinuidades;
    } catch (error) {
        return [];
    }
}

function obtenerDiscontinuidadesGraficables(texto, xMinimo, xMaximo) {
    return [
        ...obtenerDiscontinuidadesRacionales(texto),
        ...obtenerDiscontinuidadesTrigonométricas(texto, xMinimo, xMaximo)
    ];
}


/* =====================================================
   APLICAR FUNCIÓN
===================================================== */

function aplicarFuncion() {

    if (!entradaFuncion) {
        return;
    }

    const texto =
        entradaFuncion.value.trim();

    console.log("DOMINIO - expresión original:", texto);

    if (texto === "") {

        alert(
            "Escribe una función primero."
        );

        return;
    }


    const nuevaFuncion =
        prepararFuncion(texto);


    if (!nuevaFuncion) {

        alert(
            "La función no es válida. Revisa cómo está escrita."
        );

        return;
    }


    funcionActual =
        nuevaFuncion;

    funcionTextoActual =
        texto;

    invalidarPuntoEvaluado();
    if (
        modalidadControl === "gestos" &&
        [1, 5].includes(cantidadDedosDerechaActual)
    ) {
        ultimaFuncionDerechaProcesada = nuevaFuncion;
    }

    const funcionEsDosVariables =
        esFuncionDosVariables(nuevaFuncion);

    if (evaluacionPunto) {
        evaluacionPunto.hidden = funcionEsDosVariables;
    }

    cerrarModalAdvertencia();

    if (canvasGrafica) {
        canvasGrafica.style.display =
            funcionEsDosVariables ? "none" : "block";
    }

    if (canvasSuperficie3D) {
        canvasSuperficie3D.style.display =
            funcionEsDosVariables ? "block" : "none";
    }


    /* -------------------------------------------------
       MOSTRAR FUNCIÓN
    ------------------------------------------------- */

    mostrarFuncionExacta(texto);


    /* -------------------------------------------------
       CALCULAR DOMINIO REAL
    ------------------------------------------------- */

    if (dominio) {

        dominio.textContent = funcionEsDosVariables
            ? "Dominio: FUNCIÓN DE DOS VARIABLES"
            : "Dominio: " + calcularDominio(texto);
    }


    /* -------------------------------------------------
       MENSAJE
    ------------------------------------------------- */

    const mensaje =
        document.querySelector(
            ".graph-center-message small"
        );

    if (mensaje) {

        mensaje.textContent =
            "FUNCIÓN CARGADA";

        mensaje.closest(".graph-center-message").style.display =
            "none";
    }


    /* -------------------------------------------------
       ESTADO
    ------------------------------------------------- */

    if (estadoFuncion) {
        estadoFuncion.textContent = "FUNCIÓN LISTA PARA INTERACTUAR";
    }


    /* -------------------------------------------------
       ACTUALIZAR GRÁFICA
    ------------------------------------------------- */

    actualizarGrafica();

    actualizarPanelesInteraccion(0);


    console.log(
        "Función aplicada:",
        texto
    );

}


/* =====================================================
   BOTÓN APLICAR
===================================================== */

if (botonAplicar) {

    botonAplicar.addEventListener(
        "click",
        aplicarFuncion
    );
}


/* =====================================================
   ENTER PARA APLICAR
===================================================== */

if (entradaFuncion) {

    entradaFuncion.addEventListener(
        "keydown",
        function (evento) {

            if (evento.key === "Enter") {

                evento.preventDefault();

                aplicarFuncion();
            }
        }
    );
}

function calcularEscalaUnidades(ancho, alto, zoom = escalaGrafica) {
    return Math.min(
        Math.max(1, ancho / 2) / rangoEjeX,
        Math.max(1, alto / 2) / rangoEjeY
    ) * zoom;
}

function animarZoomManual() {
    if (!funcionActual || esFuncionDosVariables(funcionActual)) {
        return;
    }

    if (document.hidden) {
        animacionZoomManualEnCurso = false;
        escalaGrafica = escalaGraficaObjetivo;
        firmaBaseGrafica = null;
        firmaGraficaSolicitada = null;
        actualizarGrafica();
        return;
    }

    if (animacionZoomManualEnCurso) {
        return;
    }

    animacionZoomManualEnCurso = true;
    firmaBaseGrafica = null;
    firmaGraficaSolicitada = null;

    const dibujarSiguienteFrame = () => {
        if (!funcionActual || esFuncionDosVariables(funcionActual)) {
            animacionZoomManualEnCurso = false;
            return;
        }

        const zoomTerminado =
            Math.abs(escalaGraficaObjetivo - escalaGrafica) <= 0.001;

        if (zoomTerminado) {
            escalaGrafica = escalaGraficaObjetivo;
        }

        actualizarGrafica();

        if (zoomTerminado) {
            animacionZoomManualEnCurso = false;
            return;
        }

        requestAnimationFrame(dibujarSiguienteFrame);
    };

    requestAnimationFrame(dibujarSiguienteFrame);
}

function cambiarZoomGrafica(factor, anclaX = null, anclaY = null) {
    const ancho = canvasGrafica?.clientWidth || 600;
    const alto = canvasGrafica?.clientHeight || 400;
    const escalaAnterior = calcularEscalaUnidades(
        ancho,
        alto,
        escalaGraficaObjetivo
    );
    const escalaObjetivo = Math.max(
        escalaMinimaZoomManual,
        Math.min(escalaMaxima, escalaGraficaObjetivo * factor)
    );

    if (anclaX !== null && anclaY !== null) {
        const escalaNueva = calcularEscalaUnidades(
            ancho,
            alto,
            escalaObjetivo
        );
        const xMatematico =
            centroVistaX + (anclaX - ancho / 2) / escalaAnterior;
        const yMatematico =
            centroVistaY + (alto / 2 - anclaY) / escalaAnterior;

        centroVistaX =
            xMatematico - (anclaX - ancho / 2) / escalaNueva;
        centroVistaY =
            yMatematico - (alto / 2 - anclaY) / escalaNueva;
    }

    escalaGraficaObjetivo = escalaObjetivo;
    animarZoomManual();
}

function restablecerVistaGrafica() {
    escalaGraficaObjetivo = 1;
    centroVistaX = 0;
    centroVistaY = 0;
    intervaloEjeComunActual = 1;
    firmaBaseGrafica = null;
    firmaGraficaSolicitada = null;
    animarZoomManual();
}

botonAlejarGrafica?.addEventListener(
    "click",
    () => cambiarZoomGrafica(1 / 1.25)
);
botonAcercarGrafica?.addEventListener(
    "click",
    () => cambiarZoomGrafica(1.25)
);
botonRestablecerVistaGrafica?.addEventListener(
    "click",
    restablecerVistaGrafica
);

const contenedorGrafica = canvasGrafica?.parentElement;

contenedorGrafica?.addEventListener("pointerdown", evento => {
    if (
        evento.button !== 0 ||
        !funcionActual ||
        esFuncionDosVariables(funcionActual)
    ) {
        return;
    }

    arrastreVistaGrafica = {
        pointerId: evento.pointerId,
        x: evento.clientX,
        y: evento.clientY
    };
    contenedorGrafica.setPointerCapture(evento.pointerId);
    evento.preventDefault();
});

contenedorGrafica?.addEventListener("pointermove", evento => {
    if (
        !arrastreVistaGrafica ||
        evento.pointerId !== arrastreVistaGrafica.pointerId
    ) {
        return;
    }

    const escala = calcularEscalaUnidades(
        canvasGrafica.clientWidth,
        canvasGrafica.clientHeight,
        escalaGrafica
    );
    const desplazamientoX = evento.clientX - arrastreVistaGrafica.x;
    const desplazamientoY = evento.clientY - arrastreVistaGrafica.y;

    centroVistaX -= desplazamientoX / escala;
    centroVistaY += desplazamientoY / escala;
    arrastreVistaGrafica.x = evento.clientX;
    arrastreVistaGrafica.y = evento.clientY;
    firmaBaseGrafica = null;
    firmaGraficaSolicitada = null;
    actualizarGrafica();
});

const finalizarArrastreGrafica = evento => {
    if (
        !arrastreVistaGrafica ||
        evento.pointerId !== arrastreVistaGrafica.pointerId
    ) {
        return;
    }

    if (contenedorGrafica.hasPointerCapture(evento.pointerId)) {
        contenedorGrafica.releasePointerCapture(evento.pointerId);
    }
    arrastreVistaGrafica = null;
};

contenedorGrafica?.addEventListener("pointerup", finalizarArrastreGrafica);
contenedorGrafica?.addEventListener("pointercancel", finalizarArrastreGrafica);

contenedorGrafica?.addEventListener("wheel", evento => {
    if (!funcionActual || esFuncionDosVariables(funcionActual)) {
        return;
    }

    evento.preventDefault();
    const rectangulo = canvasGrafica.getBoundingClientRect();
    cambiarZoomGrafica(
        evento.deltaY < 0 ? 1.15 : 1 / 1.15,
        evento.clientX - rectangulo.left,
        evento.clientY - rectangulo.top
    );
}, { passive: false });

function seleccionarIntervaloComun(
    xMinimo,
    xMaximo,
    yMinimo,
    yMaximo,
    ancho,
    alto
) {
    const magnitudVisible = Math.max(
        Math.abs(xMinimo),
        Math.abs(xMaximo),
        Math.abs(yMinimo),
        Math.abs(yMaximo)
    );

    if (magnitudVisible <= 10) {
        intervaloEjeComunActual = 1;
        return 1;
    }

    const cantidadMarcasX = Math.max(2, Math.floor(ancho / 56));
    const cantidadMarcasY = Math.max(2, Math.floor(alto / 24));
    const intervaloNecesario = Math.max(
        5,
        (xMaximo - xMinimo) / cantidadMarcasX,
        (yMaximo - yMinimo) / cantidadMarcasY
    );
    const exponenteInicial = Math.floor(Math.log10(intervaloNecesario));

    for (
        let exponente = exponenteInicial;
        exponente <= exponenteInicial + 1;
        exponente++
    ) {
        const potencia = Math.pow(10, exponente);
        for (const factor of [1, 2, 2.5, 5]) {
            const intervalo = factor * potencia;
            if (intervalo >= intervaloNecesario) {
                const subirIntervalo =
                    intervalo > intervaloEjeComunActual;
                const cambioEstable = subirIntervalo
                    ? intervaloNecesario >= intervaloEjeComunActual * 1.15
                    : intervaloNecesario <= intervaloEjeComunActual * 0.8;

                if (intervaloEjeComunActual < 5 || cambioEstable) {
                    intervaloEjeComunActual = intervalo;
                }

                return intervaloEjeComunActual;
            }
        }
    }

    intervaloEjeComunActual = intervaloNecesario;
    return intervaloEjeComunActual;
}

function actualizarCuadriculaGrafica(espacioX, espacioY, origenX, origenY) {
    const cuadricula =
        canvasGrafica?.parentElement?.querySelector(".graph-grid");
    if (!cuadricula) {
        return;
    }

    const moduloPositivo = (valor, modulo) =>
        ((valor % modulo) + modulo) % modulo;

    cuadricula.style.setProperty("--graph-grid-step-x", `${espacioX}px`);
    cuadricula.style.setProperty("--graph-grid-step-y", `${espacioY}px`);
    cuadricula.style.setProperty(
        "--graph-grid-offset-x",
        `${moduloPositivo(origenX, espacioX)}px`
    );
    cuadricula.style.setProperty(
        "--graph-grid-offset-y",
        `${moduloPositivo(origenY, espacioY)}px`
    );
}

function restablecerCuadriculaGrafica() {
    const cuadricula =
        canvasGrafica?.parentElement?.querySelector(".graph-grid");
    if (!cuadricula) {
        return;
    }

    for (const propiedad of [
        "--graph-grid-step-x",
        "--graph-grid-step-y",
        "--graph-grid-offset-x",
        "--graph-grid-offset-y"
    ]) {
        cuadricula.style.removeProperty(propiedad);
    }
}

/* =====================================================
   GRAFICAR FUNCIÓN
===================================================== */

function graficarFuncion() {

    if (
        !canvasGrafica ||
        !funcionActual
    ) {
        return;
    }


    const canvas =
        canvasGrafica;

    const contexto =
        canvas.getContext("2d");

    if (!contexto) {
        return;
    }


    const ancho =
        canvas.clientWidth || 600;

    const alto =
        canvas.clientHeight || 400;


    if (canvas.width !== ancho) {
        canvas.width = ancho;
    }

    if (canvas.height !== alto) {
        canvas.height = alto;
    }


    /* -------------------------------------------------
       ESCALA
    ------------------------------------------------- */

    escalaGrafica +=
        (escalaGraficaObjetivo - escalaGrafica) * 0.12;

    const escalaUnidad =
        calcularEscalaUnidades(ancho, alto, escalaGrafica);

    const escalaX =
        escalaUnidad;

    const escalaY =
        escalaUnidad;

    const desplazamientoX =
        -centroVistaX * escalaUnidad;

    const desplazamientoY =
        -centroVistaY * escalaUnidad;

    const firmaActualBase =
        funcionTextoActual + "|" +
        ancho + "|" + alto + "|" +
        escalaGrafica + "|" +
        rangoEjeX + "|" + rangoEjeY + "|" +
        centroVistaX + "|" + centroVistaY;
    const reconstruirBase =
        firmaActualBase !== firmaBaseGrafica;

    if (!lienzoBaseGrafica) {
        lienzoBaseGrafica = document.createElement("canvas");
    }

    if (lienzoBaseGrafica.width !== ancho) {
        lienzoBaseGrafica.width = ancho;
    }

    if (lienzoBaseGrafica.height !== alto) {
        lienzoBaseGrafica.height = alto;
    }

    contexto.clearRect(0, 0, ancho, alto);

    if (!reconstruirBase) {
        contexto.drawImage(lienzoBaseGrafica, 0, 0);
    }

    const origenX =
        convertirX(0);

    const origenY =
        convertirY(0);


    /* -------------------------------------------------
       COORDENADAS
    ------------------------------------------------- */

    function convertirX(x) {

        return (
            ancho / 2 +
            desplazamientoX +
            x * escalaX
        );
    }


    function convertirY(y) {

        return (
            alto / 2 -
            desplazamientoY -
            y * escalaY
        );
    }

    function dibujarSegmentoVisible(x1, y1, x2, y2) {
        const escalaY = Math.max(1, Math.abs(y1), Math.abs(y2), alto);
        const y1Normalizado = y1 / escalaY;
        const y2Normalizado = y2 / escalaY;
        const deltaX = x2 - x1;
        const deltaY = y2Normalizado - y1Normalizado;
        const altoNormalizado = alto / escalaY;
        let inicio = 0;
        let fin = 1;

        const limites = [
            [-deltaX, x1],
            [deltaX, ancho - x1],
            [-deltaY, y1Normalizado],
            [deltaY, altoNormalizado - y1Normalizado]
        ];

        for (const [p, q] of limites) {
            if (p === 0) {
                if (q < 0) {
                    return;
                }
                continue;
            }

            const proporcion = q / p;
            if (p < 0) {
                inicio = Math.max(inicio, proporcion);
            } else {
                fin = Math.min(fin, proporcion);
            }

            if (inicio > fin) {
                return;
            }
        }

        const xInicio = x1 + inicio * deltaX;
        const yInicio = Math.max(
            0,
            Math.min(
                alto,
                (y1Normalizado + inicio * deltaY) * escalaY
            )
        );
        const xFin = x1 + fin * deltaX;
        const yFin = Math.max(
            0,
            Math.min(
                alto,
                (y1Normalizado + fin * deltaY) * escalaY
            )
        );

        contexto.moveTo(xInicio, yInicio);
        contexto.lineTo(xFin, yFin);
    }


    /* -------------------------------------------------
       EJES
    ------------------------------------------------- */

    if (reconstruirBase) {
        const xMinimoVisible =
            (0 - ancho / 2 - desplazamientoX) / escalaX;
        const xMaximoVisible =
            (ancho - ancho / 2 - desplazamientoX) / escalaX;
        const yMaximoVisible =
            origenY / escalaY;
        const yMinimoVisible =
            (origenY - alto) / escalaY;
        const intervaloComun = seleccionarIntervaloComun(
            xMinimoVisible,
            xMaximoVisible,
            yMinimoVisible,
            yMaximoVisible,
            ancho,
            alto
        );
        actualizarCuadriculaGrafica(
            intervaloComun * escalaX,
            intervaloComun * escalaY,
            origenX,
            origenY
        );
        const decimales = Math.max(
            0,
            Math.min(10, Math.ceil(-Math.log10(intervaloComun)))
        );
        const formatearMarca = valor =>
            String(Number(valor.toFixed(decimales)));

        contexto.save();
        contexto.lineWidth = 1;
        contexto.strokeStyle = "rgba(150, 220, 235, 0.7)";
        contexto.font = "11px Arial";
        contexto.fillStyle = "#dffaff";

        const ejeXVisible = origenY >= 0 && origenY <= alto;
        const ejeYVisible = origenX >= 0 && origenX <= ancho;

        if (ejeXVisible) {
            contexto.beginPath();
            contexto.moveTo(0, origenY);
            contexto.lineTo(ancho, origenY);
            contexto.stroke();
        }

        if (ejeYVisible) {
            contexto.beginPath();
            contexto.moveTo(origenX, 0);
            contexto.lineTo(origenX, alto);
            contexto.stroke();
        }

        const primerTickX =
            Math.ceil(xMinimoVisible / intervaloComun) * intervaloComun;
        for (
            let tick = primerTickX, cantidad = 0;
            tick <= xMaximoVisible && cantidad < 200;
            tick += intervaloComun, cantidad++
        ) {
            const px = convertirX(tick);
            if (px < 0 || px > ancho) {
                continue;
            }

            const posicionEjeX = ejeXVisible ? origenY : alto - 1;
            contexto.beginPath();
            contexto.moveTo(px, posicionEjeX - 4);
            contexto.lineTo(px, posicionEjeX + 4);
            contexto.stroke();

            let posicionEtiquetaX;
            contexto.textAlign = "center";
            if (!ejeXVisible) {
                posicionEtiquetaX = alto - 5;
                contexto.textBaseline = "bottom";
            } else if (origenY < alto - 20) {
                posicionEtiquetaX = origenY + 7;
                contexto.textBaseline = "top";
            } else {
                posicionEtiquetaX = origenY - 7;
                contexto.textBaseline = "bottom";
            }

            const etiquetaX = formatearMarca(tick);
            const anchoEtiquetaX = contexto.measureText(etiquetaX).width;
            if (px < anchoEtiquetaX / 2 + 2) {
                contexto.textAlign = "left";
                contexto.fillText(etiquetaX, 2, posicionEtiquetaX);
            } else if (px > ancho - anchoEtiquetaX / 2 - 2) {
                contexto.textAlign = "right";
                contexto.fillText(etiquetaX, ancho - 2, posicionEtiquetaX);
            } else {
                contexto.fillText(etiquetaX, px, posicionEtiquetaX);
            }
        }

        const primerTickY =
            Math.ceil(yMinimoVisible / intervaloComun) * intervaloComun;
        for (
            let tick = primerTickY, cantidad = 0;
            tick <= yMaximoVisible && cantidad < 200;
            tick += intervaloComun, cantidad++
        ) {
            const py = convertirY(tick);
            if (py < 0 || py > alto || tick === 0) {
                continue;
            }

            const posicionEjeY = ejeYVisible ? origenX : 1;
            contexto.beginPath();
            contexto.moveTo(posicionEjeY - 4, py);
            contexto.lineTo(posicionEjeY + 4, py);
            contexto.stroke();

            contexto.textBaseline = "middle";
            const posicionEtiquetaY = Math.max(7, Math.min(alto - 7, py));
            if (ejeYVisible && origenX >= 40) {
                contexto.textAlign = "right";
                contexto.fillText(
                    formatearMarca(tick),
                    origenX - 7,
                    posicionEtiquetaY
                );
            } else {
                contexto.textAlign = "left";
                contexto.fillText(
                    formatearMarca(tick),
                    7,
                    posicionEtiquetaY
                );
            }
        }

        contexto.restore();
    }


    /* -------------------------------------------------
       GRÁFICA
    ------------------------------------------------- */

    if (reconstruirBase) {
        contexto.beginPath();

        let puntoAnterior = null;
        const xMinimoVisible =
            (0 - ancho / 2 - desplazamientoX) / escalaX;
        const xMaximoVisible =
            (ancho - ancho / 2 - desplazamientoX) / escalaX;
        const discontinuidades =
            obtenerDiscontinuidadesGraficables(
                funcionTextoActual,
                xMinimoVisible,
                xMaximoVisible
            );

        for (let pixelX = 0; pixelX <= ancho; pixelX++) {
            const x =
                (pixelX - ancho / 2 - desplazamientoX) / escalaX;
            let y;

            try {
                y = funcionActual(x);
            } catch (error) {
                puntoAnterior = null;
                continue;
            }

            if (typeof y !== "number" || !Number.isFinite(y)) {
                puntoAnterior = null;
                continue;
            }

            if (
                puntoAnterior &&
                discontinuidades.some(
                    discontinuidad =>
                        discontinuidad > Math.min(puntoAnterior.x, x) &&
                        discontinuidad < Math.max(puntoAnterior.x, x)
                )
            ) {
                puntoAnterior = null;
            }

            let pixelY = convertirY(y);
            if (!Number.isFinite(pixelY)) {
                pixelY = y > centroVistaY
                    ? -Number.MAX_VALUE
                    : Number.MAX_VALUE;
            }

            if (puntoAnterior) {
                dibujarSegmentoVisible(
                    puntoAnterior.pixelX,
                    puntoAnterior.pixelY,
                    pixelX,
                    pixelY
                );
            }

            puntoAnterior = { x, pixelX, pixelY };
        }

        contexto.lineWidth = 3;
        contexto.strokeStyle = "#00e5ff";
        contexto.stroke();

        const contextoBase = lienzoBaseGrafica.getContext("2d");
        contextoBase.clearRect(0, 0, ancho, alto);
        contextoBase.drawImage(canvas, 0, 0);
        firmaBaseGrafica = firmaActualBase;
    }

    if (
        derivadaDerechaVisible &&
        funcionDerivadaActual &&
        funcionSegundaDerivadaActual
    ) {
        const dibujarCurvaDerivada = (
            funcion,
            color,
            grosor
        ) => {
            contexto.beginPath();
            contexto.strokeStyle = color;
            contexto.lineWidth = grosor;

            let puntoAnterior = null;
            const xMinimoVisible =
                (0 - ancho / 2 - desplazamientoX) / escalaX;
            const xMaximoVisible =
                (ancho - ancho / 2 - desplazamientoX) / escalaX;
            const discontinuidades =
                obtenerDiscontinuidadesGraficables(
                    funcionTextoActual,
                    xMinimoVisible,
                    xMaximoVisible
                );

            for (let pixelX = 0; pixelX <= ancho; pixelX++) {
                const valorX =
                    (pixelX - ancho / 2 - desplazamientoX) /
                    escalaX;
                let valorY;

                try {
                    valorY = funcion(valorX);
                } catch (error) {
                    puntoAnterior = null;
                    continue;
                }

                if (
                    !Number.isFinite(valorY) ||
                    (puntoAnterior &&
                        discontinuidades.some(
                            discontinuidad =>
                                discontinuidad > Math.min(puntoAnterior.x, valorX) &&
                                discontinuidad < Math.max(puntoAnterior.x, valorX)
                        ))
                ) {
                    puntoAnterior = null;
                    continue;
                }

                let pixelY = convertirY(valorY);
                if (!Number.isFinite(pixelY)) {
                    pixelY = valorY > centroVistaY
                        ? -Number.MAX_VALUE
                        : Number.MAX_VALUE;
                }

                if (puntoAnterior) {
                    dibujarSegmentoVisible(
                        puntoAnterior.pixelX,
                        puntoAnterior.pixelY,
                        pixelX,
                        pixelY
                    );
                }

                puntoAnterior = { x: valorX, pixelX, pixelY };
            }

            contexto.stroke();
        };

        dibujarCurvaDerivada(
            funcionDerivadaActual,
            "#ff4fd8",
            2
        );

        dibujarCurvaDerivada(
            funcionSegundaDerivadaActual,
            "#ffd166",
            2
        );
    }

    if (puntoCriticoDerechaVisible) {
        for (const xCritico of puntosCriticosActuales) {
            let yCritico;

            try {
                yCritico = funcionActual(xCritico);
            } catch (error) {
                continue;
            }

            if (!Number.isFinite(yCritico)) {
                continue;
            }

            const pixelCriticoX = convertirX(xCritico);
            const pixelCriticoY = convertirY(yCritico);

            if (
                pixelCriticoX < 0 ||
                pixelCriticoX > ancho ||
                pixelCriticoY < 0 ||
                pixelCriticoY > alto
            ) {
                continue;
            }

            contexto.beginPath();
            contexto.fillStyle = "#ffd166";
            contexto.strokeStyle = "#ffffff";
            contexto.lineWidth = 3;
            contexto.arc(
                pixelCriticoX,
                pixelCriticoY,
                7,
                0,
                Math.PI * 2
            );
            contexto.fill();
            contexto.stroke();
        }
    }

    function dibujarGuiaPunto(x, estilo) {
        let y;

        try {
            y = funcionActual(x);
        } catch (error) {
            return;
        }

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return;
        }

        const pixelX = convertirX(x);
        const pixelYReal = convertirY(y);

        if (
            pixelX < 0 ||
            pixelX > ancho
        ) {
            return;
        }

        if (
            !estilo.permitirFueraDeY &&
            (pixelYReal < 0 || pixelYReal > alto)
        ) {
            return;
        }

        const pixelY = estilo.permitirFueraDeY
            ? Math.max(6, Math.min(alto - 6, pixelYReal))
            : pixelYReal;

        contexto.save();
        contexto.beginPath();
        contexto.setLineDash(estilo.trazos);
        contexto.strokeStyle = estilo.colorGuia;
        contexto.lineWidth = estilo.grosorGuia;
        contexto.moveTo(pixelX, 0);
        contexto.lineTo(pixelX, alto);
        contexto.moveTo(0, pixelY);
        contexto.lineTo(ancho, pixelY);
        contexto.stroke();

        contexto.beginPath();
        contexto.strokeStyle = estilo.colorBorde;
        contexto.lineWidth = estilo.grosorBorde;
        contexto.arc(
            pixelX,
            pixelY,
            estilo.radio,
            0,
            Math.PI * 2
        );

        if (estilo.relleno) {
            contexto.fillStyle = estilo.colorRelleno;
            contexto.fill();
        }

        contexto.stroke();
        contexto.restore();
    }

    if (
        retoAplicadoDerechaVisible &&
        !retoAplicadoSeleccionado &&
        posicionRetoCandidataX !== null
    ) {
        dibujarGuiaPunto(
            posicionRetoCandidataX,
            {
                trazos: [4, 6],
                colorGuia: "rgba(93, 255, 176, 0.45)",
                grosorGuia: 1,
                colorBorde: "#5dffb0",
                grosorBorde: 2,
                radio: 6,
                relleno: false
            }
        );
    }

    if (
        retoAplicadoDerechaVisible &&
        posicionRetoAplicadoX !== null
    ) {
        dibujarGuiaPunto(
            posicionRetoAplicadoX,
            {
                trazos: [],
                colorGuia: "rgba(93, 255, 176, 0.8)",
                grosorGuia: 2,
                colorRelleno: "#5dffb0",
                colorBorde: "#ffffff",
                grosorBorde: 3,
                radio: 8,
                relleno: true
            }
        );
    }

    if (
        tangenteDerechaVisible &&
        puntoDerechaSeleccionado &&
        posicionPuntoSeleccionadoX !== null
    ) {
        const xTangente =
            posicionPuntoSeleccionadoX;

        const yTangente = funcionActual(xTangente);
        const pasoDerivada = 0.0001;
        const valorAnterior = funcionActual(
            xTangente - pasoDerivada
        );
        const valorSiguiente = funcionActual(
            xTangente + pasoDerivada
        );

        if (
            Number.isFinite(yTangente) &&
            Number.isFinite(valorAnterior) &&
            Number.isFinite(valorSiguiente)
        ) {
            const pendiente =
                (valorSiguiente - valorAnterior) /
                (2 * pasoDerivada);

            contexto.beginPath();
            contexto.strokeStyle = "#ffd166";
            contexto.lineWidth = 2;

            let puntoAnteriorTangente = null;

            for (let pixelX = 0; pixelX <= ancho; pixelX++) {
                const valorX =
                    (pixelX - ancho / 2 - desplazamientoX) /
                    escalaX;
                const valorY =
                    pendiente *
                    (valorX - xTangente) +
                    yTangente;
                let pixelY = convertirY(valorY);
                if (!Number.isFinite(pixelY)) {
                    pixelY = valorY > centroVistaY
                        ? -Number.MAX_VALUE
                        : Number.MAX_VALUE;
                }

                if (puntoAnteriorTangente) {
                    dibujarSegmentoVisible(
                        puntoAnteriorTangente.x,
                        puntoAnteriorTangente.y,
                        pixelX,
                        pixelY
                    );
                }

                puntoAnteriorTangente = { x: pixelX, y: pixelY };
            }

            contexto.stroke();
        }
    }

    if (
        puntoDerechaVisible &&
        (
            (
                puntoDerechaSeleccionado &&
                posicionPuntoSeleccionadoX !== null
            ) ||
            (
                !puntoDerechaSeleccionado &&
                posicionPuntoDerechaX !== null
            )
        )
    ) {
        let xPunto;

        if (puntoDerechaSeleccionado) {
            xPunto = posicionPuntoSeleccionadoX;
        } else {
            const pixelPuntoX =
                posicionPuntoDerechaX * ancho;

            const xPuntoSinLimite =
                (pixelPuntoX - ancho / 2 - desplazamientoX) /
                escalaX;

            xPunto = xPuntoSinLimite;
        }

        dibujarGuiaPunto(
            xPunto,
            puntoDerechaSeleccionado
                ? {
                    trazos: [],
                    colorGuia: "rgba(255, 79, 216, 0.8)",
                    grosorGuia: 2,
                    colorRelleno: "#ff4fd8",
                    colorBorde: "#ffffff",
                    grosorBorde: 3,
                    radio: 6,
                    relleno: true
                }
                : {
                    trazos: [4, 6],
                    colorGuia: "rgba(255, 79, 216, 0.45)",
                    grosorGuia: 1,
                    colorBorde: "#ff4fd8",
                    grosorBorde: 2,
                    radio: 6,
                    relleno: false
                }
        );
    }
}


/* =====================================================
   ACTUALIZAR GRÁFICA
===================================================== */

function actualizarGrafica() {

    if (funcionActual) {

        if (esFuncionDosVariables(funcionActual)) {
            actualizarSuperficie3D(funcionActual);
            return;
        }

        graficarFuncion();
    }
}


/* =====================================================
   ESTABILIZACIÓN MANO DERECHA
===================================================== */

function estabilizarDedos(
    cantidadDetectada
) {

    historialDedosDerecha.push(
        cantidadDetectada
    );


    if (
        historialDedosDerecha.length >
        cantidadMuestras
    ) {

        historialDedosDerecha.shift();
    }


    if (
        historialDedosDerecha.length <
        cantidadMuestras
    ) {

        if (
            dedosDerechaEstables === null
        ) {

            dedosDerechaEstables =
                cantidadDetectada;
        }

        return dedosDerechaEstables;
    }


    const conteo = {};


    for (
        const cantidad
        of historialDedosDerecha
    ) {

        if (
            conteo[cantidad] === undefined
        ) {

            conteo[cantidad] = 0;
        }

        conteo[cantidad]++;
    }


    let mejorCantidad =
        dedosDerechaEstables;

    let mayorRepeticion = 0;


    for (
        const cantidad
        in conteo
    ) {

        if (
            conteo[cantidad] >
            mayorRepeticion
        ) {

            mayorRepeticion =
                conteo[cantidad];

            mejorCantidad =
                Number(cantidad);
        }
    }


    if (
        mayorRepeticion >=
        minimoCoincidencias
    ) {

        dedosDerechaEstables =
            mejorCantidad;
    }


    return dedosDerechaEstables;
}


/* =====================================================
   DISTANCIA
===================================================== */

function distancia(
    punto1,
    punto2
) {

    const dx =
        punto1.x -
        punto2.x;

    const dy =
        punto1.y -
        punto2.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


/* =====================================================
   CONTAR DEDOS
===================================================== */

function contarDedos(mano) {

    let dedos = 0;


    const distanciaPulgar =
        distancia(
            mano[4],
            mano[5]
        );


    const distanciaBase =
        distancia(
            mano[2],
            mano[5]
        );


    if (
        distanciaPulgar >
        distanciaBase
    ) {

        dedos++;
    }


    if (
        mano[8].y <
        mano[6].y
    ) {

        dedos++;
    }


    if (
        mano[12].y <
        mano[10].y
    ) {

        dedos++;
    }


    if (
        mano[16].y <
        mano[14].y
    ) {

        dedos++;
    }


    if (
        mano[20].y <
        mano[18].y
    ) {

        dedos++;
    }


    return dedos;
}


/* =====================================================
   DIBUJAR MANO
===================================================== */

const conexionesMano = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
];

function dibujarMano(
    mano,
    color
) {

    if (!ctx) {
        return;
    }


    ctx.fillStyle =
        color;

    ctx.strokeStyle =
        color;

    ctx.lineWidth = 3;


    for (
        const punto
        of mano
    ) {

        const x =
            punto.x *
            lienzo.width;

        const y =
            punto.y *
            lienzo.height;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    for (
        const [inicio, fin]
        of conexionesMano
    ) {

        const x1 =
            mano[inicio].x *
            lienzo.width;

        const y1 =
            mano[inicio].y *
            lienzo.height;

        const x2 =
            mano[fin].x *
            lienzo.width;

        const y2 =
            mano[fin].y *
            lienzo.height;


        ctx.beginPath();

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.stroke();
    }
}


/* =====================================================
   ESTADO DE LA MANO IZQUIERDA
   Solo muestra lo que está haciendo: en reposo,
   rotando o haciendo zoom (no usa conteo de dedos).
===================================================== */

const textosEstadoIzquierda = {
    reposo: "EN REPOSO",
    rotando: "ROTANDO",
    zoom: "ZOOM"
};

function mostrarEstadoIzquierda(estado) {

    if (!estadoIzquierda) {
        return;
    }

    if (estadoIzquierda.dataset.estado === estado) {
        return;
    }

    estadoIzquierda.textContent =
        textosEstadoIzquierda[estado];

    estadoIzquierda.dataset.estado =
        estado;
}


/* =====================================================
   ROTACIÓN
===================================================== */

function controlarRotacionIzquierda(
    mano
) {

    const x =
        mano[9].x;

    const y =
        mano[9].y;


    const posicionHorizontal =
        x - 0.5;

    const posicionVertical =
        y - 0.5;


    rotacionYObjetivo =
        posicionHorizontal *
        sensibilidadRotacionY;

    rotacionXObjetivo =
        posicionVertical *
        sensibilidadRotacionX;
}


/* =====================================================
   CONTROL ZOOM
===================================================== */

function controlarZoomIzquierda(
    mano
) {

    const distanciaPinza =
        distancia(
            mano[4],
            mano[8]
        );


    let porcentajeZoom =
        (
            distanciaPinza -
            distanciaZoomMinima
        ) /
        (
            distanciaZoomMaxima -
            distanciaZoomMinima
        );


    porcentajeZoom =
        Math.max(
            0,
            Math.min(
                1,
                porcentajeZoom
            )
        );


    escalaGraficaObjetivo =
        escalaMinima +
        (
            porcentajeZoom *
            (
                escalaMaxima -
                escalaMinima
            )
        );
}


/* =====================================================
   PINZA REAL
===================================================== */

function esPinzaReal(
    mano
) {

    const distanciaPulgarIndice =
        distancia(
            mano[4],
            mano[8]
        );


    if (
        distanciaPulgarIndice >
        distanciaPinzaEntrada
    ) {

        return false;
    }


    let dedosRecogidos = 0;


    if (
        mano[12].y >
        mano[10].y
    ) {

        dedosRecogidos++;
    }


    if (
        mano[16].y >
        mano[14].y
    ) {

        dedosRecogidos++;
    }


    if (
        mano[20].y >
        mano[18].y
    ) {

        dedosRecogidos++;
    }


    return (
        dedosRecogidos >=
        minimoDedosRecogidosParaZoom
    );
}


/* =====================================================
   DETERMINAR MODO IZQUIERDA
===================================================== */

function determinarModoIzquierda(
    mano
) {

    const distanciaPulgarIndice =
        distancia(
            mano[4],
            mano[8]
        );


    const pinzaDetectada =
        esPinzaReal(mano);


    if (modoZoomIzquierda) {

        if (
            distanciaPulgarIndice >
            distanciaPinzaSalida
        ) {

            contadorSalidaZoom++;

        } else if (
            !pinzaDetectada
        ) {

            contadorSalidaZoom++;

        } else {

            contadorSalidaZoom = 0;
        }


        if (
            contadorSalidaZoom >=
            framesParaSalirZoom
        ) {

            modoZoomIzquierda = false;

            contadorSalidaZoom = 0;
        }

    } else {

        if (pinzaDetectada) {

            contadorEntradaZoom++;

        } else {

            contadorEntradaZoom = 0;
        }


        if (
            contadorEntradaZoom >=
            framesParaEntrarZoom
        ) {

            modoZoomIzquierda = true;

            contadorEntradaZoom = 0;
        }
    }


    return modoZoomIzquierda;
}


/* =====================================================
   INICIAR MEDIAPIPE
===================================================== */

async function iniciarMediaPipe() {

    try {

        const vision =
            await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );


        handLandmarker =
            await HandLandmarker.createFromOptions(
                vision,
                {

                    baseOptions: {

                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

                        delegate: "GPU"
                    },

                    runningMode: "VIDEO",

                    numHands: 2
                }
            );


        console.log(
            "MediaPipe: detector de dos manos listo."
        );

    } catch (error) {

        console.error(
            "Error iniciando MediaPipe:",
            error
        );
    }
}


/* =====================================================
   REDIMENSIONAR
===================================================== */

window.addEventListener(
    "resize",
    function () {

        actualizarTamanoSuperficie3D();
        actualizarGrafica();
    }
);


/* =====================================================
   DETECTAR DOS MANOS
===================================================== */

async function detectarManos() {

    if (
        !camaraActiva ||
        !handLandmarker
    ) {

        return;
    }


    if (
        camara.readyState < 2 ||
        camara.videoWidth === 0
    ) {

        requestAnimationFrame(
            detectarManos
        );

        return;
    }

    const ahoraDeteccion = performance.now();

    if (
        ahoraDeteccion - ultimaDeteccionManos <
        intervaloDeteccionManos
    ) {
        requestAnimationFrame(detectarManos);
        return;
    }

    ultimaDeteccionManos = ahoraDeteccion;


    if (
        lienzo.width !==
        camara.videoWidth
    ) {

        lienzo.width =
            camara.videoWidth;
    }


    if (
        lienzo.height !==
        camara.videoHeight
    ) {

        lienzo.height =
            camara.videoHeight;
    }


    if (ctx) {

        ctx.clearRect(
            0,
            0,
            lienzo.width,
            lienzo.height
        );
    }


    const resultado =
        handLandmarker.detectForVideo(
            camara,
            performance.now()
        );


    if (
        resultado.landmarks.length > 0
    ) {

        const manos =
            resultado.landmarks;

        const handedness =
            resultado.handedness;


        let derechaEncontrada = false;
        let izquierdaEncontrada = false;


        for (
            let i = 0;
            i < manos.length;
            i++
        ) {

            const mano =
                manos[i];


            const tipo =
                handedness[i][0]
                    .categoryName;


            /* =========================================
               MANO DERECHA
            ========================================= */

            if (
                tipo === "Right"
            ) {

                derechaEncontrada =
                    true;

                framesSinManoDerecha =
                    0;


                const cantidadDetectada =
                    contarDedos(mano);


                const cantidadDedos =
                    estabilizarDedos(
                        cantidadDetectada
                    );
                const cambioGestoDerecha =
                    cantidadDedos !== ultimoGestoDerechaProcesado ||
                    funcionActual !== ultimaFuncionDerechaProcesada;

                if (cambioGestoDerecha) {
                    ultimoGestoDerechaProcesado = cantidadDedos;
                    ultimaFuncionDerechaProcesada = funcionActual;
                }


                if (estadoDerecha.textContent !== "DETECTADA") {
                    estadoDerecha.textContent = "DETECTADA";
                }


                if (dedosDerecha.textContent !== String(cantidadDedos)) {
                    dedosDerecha.textContent = cantidadDedos;
                }

                if (modalidadControl === "manual") {
                    dibujarMano(mano, "#00e5ff");
                    continue;
                }

                cantidadDedosDerechaActual = cantidadDedos;

                puntoDerechaVisible =
                    cantidadDedos === 1 ||
                    (
                        cantidadDedos === 2 &&
                        puntoDerechaSeleccionado &&
                        posicionPuntoSeleccionadoX !== null
                    );

                tangenteDerechaVisible =
                    cantidadDedos === 2 &&
                    puntoDerechaSeleccionado &&
                    posicionPuntoSeleccionadoX !== null;

                derivadaDerechaVisible =
                    cantidadDedos === 3 &&
                    !esFuncionDosVariables(funcionActual);

                puntoCriticoDerechaVisible =
                    cantidadDedos === 4 &&
                    !esFuncionDosVariables(funcionActual);

                retoAplicadoDerechaVisible =
                    cantidadDedos === 5 &&
                    !esFuncionDosVariables(funcionActual);

                if (retoAplicadoDerechaVisible) {
                    if (cambioGestoDerecha) {
                        const puntoValido = evaluarPuntoActivo();
                        retoAplicadoSeleccionado = puntoValido;
                        posicionRetoAplicadoX = puntoValido
                            ? posicionPuntoSeleccionadoX
                            : null;
                        posicionRetoCandidataX = null;
                    }
                } else {
                    posicionRetoAplicadoX = null;
                    ultimaPosicionRetoPx = null;
                    inicioEstabilidadReto = null;
                    retoAplicadoSeleccionado = false;
                    posicionRetoCandidataX = null;
                }

                if (derivadaDerechaVisible) {
                    if (cambioGestoDerecha) {
                        mostrarDerivadaActual();
                    }
                } else if (puntoCriticoDerechaVisible) {
                    if (cambioGestoDerecha) {
                        puntosCriticosActuales =
                            calcularPuntosCriticosSeguro();
                    }
                } else if (
                    !retoAplicadoDerechaVisible &&
                    cambioGestoDerecha
                ) {
                    puntosCriticosActuales = [];
                }

                if (cantidadDedos === 1) {
                    if (cambioGestoDerecha) {
                        evaluarPuntoActivo();
                        firmaPanelInteraccion = null;
                    }
                } else if (cantidadDedos !== 2) {
                    posicionPuntoDerechaX = null;
                    ultimaPosicionPuntoPx = null;
                    inicioEstabilidadPunto = null;
                    puntoDerechaSeleccionado = false;
                    posicionPuntoSeleccionadoX = null;
                }


                dibujarMano(
                    mano,
                    "#00e5ff"
                );


                const textoGesto =
                    cantidadDedos +
                    (
                        cantidadDedos === 1
                            ? " DEDO"
                            : " DEDOS"
                    );

                if (gesto.textContent !== textoGesto) {
                    gesto.textContent = textoGesto;
                }

                actualizarPanelesInteraccion(cantidadDedos);
            }


            /* =========================================
               MANO IZQUIERDA
            ========================================= */

            if (
                tipo === "Left"
            ) {

                izquierdaEncontrada =
                    true;


                dibujarMano(
                    mano,
                    "#a65cff"
                );

                mostrarEstadoIzquierda("reposo");
                rotacionXObjetivo = 0;
                rotacionYObjetivo = 0;
                modoZoomIzquierda = false;
                contadorEntradaZoom = 0;
                contadorSalidaZoom = 0;
            }
        }


        /* ---------------------------------------------
           SI NO ESTÁ LA MANO DERECHA
        --------------------------------------------- */

        if (!derechaEncontrada && modalidadControl === "gestos") {
            framesSinManoDerecha++;

            if (
                framesSinManoDerecha >=
                framesToleranciaPerdidaDerecha
            ) {
                estadoDerecha.textContent = "ESPERANDO";
                dedosDerecha.textContent = "—";
                cantidadDedosDerechaActual = 0;
                historialDedosDerecha = [];
                dedosDerechaEstables = null;
                puntoDerechaVisible = false;
                tangenteDerechaVisible = false;
                derivadaDerechaVisible = false;
                puntoCriticoDerechaVisible = false;
                retoAplicadoDerechaVisible = false;
                posicionPuntoDerechaX = null;
                ultimaPosicionPuntoPx = null;
                inicioEstabilidadPunto = null;
                puntoDerechaSeleccionado = false;
                posicionPuntoSeleccionadoX = null;
                posicionRetoAplicadoX = null;
                ultimaPosicionRetoPx = null;
                inicioEstabilidadReto = null;
                retoAplicadoSeleccionado = false;
                posicionRetoCandidataX = null;
                ultimoGestoDerechaProcesado = null;
                ultimaFuncionDerechaProcesada = null;

                if (gesto) {
                    gesto.textContent = "ESPERANDO...";
                }

                actualizarPanelesInteraccion(0);
            }
        }


        /* ---------------------------------------------
           SI NO ESTÁ LA MANO IZQUIERDA
        --------------------------------------------- */

        if (
            !izquierdaEncontrada
        ) {

            mostrarEstadoIzquierda("reposo");

            modoZoomIzquierda =
                false;

            contadorEntradaZoom =
                0;

            contadorSalidaZoom =
                0;

            rotacionXObjetivo =
                0;

            rotacionYObjetivo =
                0;
        }

    } else if (modalidadControl === "gestos") {

        framesSinManoDerecha++;

        if (
            framesSinManoDerecha >=
            framesToleranciaPerdidaDerecha
        ) {
            estadoDerecha.textContent = "ESPERANDO";
            dedosDerecha.textContent = "—";
            cantidadDedosDerechaActual = 0;
            gesto.textContent = "ESPERANDO...";
            actualizarPanelesInteraccion(0);
            historialDedosDerecha = [];
            dedosDerechaEstables = null;
            puntoDerechaVisible = false;
            tangenteDerechaVisible = false;
            derivadaDerechaVisible = false;
            puntoCriticoDerechaVisible = false;
            retoAplicadoDerechaVisible = false;
            posicionPuntoDerechaX = null;
            ultimaPosicionPuntoPx = null;
            inicioEstabilidadPunto = null;
            puntoDerechaSeleccionado = false;
            posicionPuntoSeleccionadoX = null;
            posicionRetoAplicadoX = null;
            ultimaPosicionRetoPx = null;
            inicioEstabilidadReto = null;
            retoAplicadoSeleccionado = false;
            posicionRetoCandidataX = null;
            ultimoGestoDerechaProcesado = null;
            ultimaFuncionDerechaProcesada = null;
        }

        mostrarEstadoIzquierda("reposo");


        modoZoomIzquierda =
            false;

        contadorEntradaZoom =
            0;

        contadorSalidaZoom =
            0;

        rotacionXObjetivo =
            0;

        rotacionYObjetivo =
            0;
    }


    if (funcionActual) {

        if (esFuncionDosVariables(funcionActual)) {
            actualizarInteraccionSuperficie3D();
        } else {
            const firmaActual =
                funcionTextoActual + "|" +
                escalaGrafica + "|" + escalaGraficaObjetivo + "|" +
                centroVistaX + "|" + centroVistaY + "|" +
                rotacionX + "|" + rotacionY + "|" +
                puntoDerechaVisible + "|" + tangenteDerechaVisible + "|" +
                derivadaDerechaVisible + "|" + puntoCriticoDerechaVisible + "|" +
                retoAplicadoDerechaVisible + "|" +
                posicionPuntoDerechaX + "|" + posicionPuntoSeleccionadoX + "|" +
                posicionRetoCandidataX + "|" + posicionRetoAplicadoX;

            if (firmaActual !== firmaGraficaSolicitada) {
                firmaGraficaSolicitada = firmaActual;
                graficarFuncion();
            }
        }
    }


    requestAnimationFrame(
        detectarManos
    );
}


/* =====================================================
   ACTIVAR CÁMARA
===================================================== */

if (botonCamara) {

    botonCamara.addEventListener(
        "click",
        async function () {

            try {

                const stream =
                    await navigator.mediaDevices
                        .getUserMedia({
                            video: true
                        });


                camara.srcObject =
                    stream;


                await camara.play();


                camaraActiva =
                    true;


                botonCamara.innerHTML =
                    "<span>●</span> CÁMARA ACTIVA";


                detectarManos();

            } catch (error) {

                console.error(
                    "No se pudo activar la cámara:",
                    error
                );


                alert(
                    "No se pudo activar la cámara. Revisa el permiso del navegador."
                );
            }
        }
    );
}


/* =====================================================
   REINICIAR
===================================================== */

if (botonReiniciar) {

    botonReiniciar.addEventListener(
        "click",
        function () {

            estadoDerecha.textContent =
                "ESPERANDO";


            dedosDerecha.textContent =
                "—";

            cantidadDedosDerechaActual = 0;
            interaccionManualPausada = false;
            actualizarPausaControlesManuales();
            invalidarPuntoEvaluado();
            cerrarModalAdvertencia();
            cerrarPanelIngresoLog();

            if (evaluacionPunto) {
                evaluacionPunto.hidden = true;
            }


            mostrarEstadoIzquierda("reposo");


            gesto.textContent =
                "ESPERANDO...";


            actualizarPanelesInteraccion(0);


            framesSinManoDerecha =
                0;

            ultimoGestoDerechaProcesado =
                null;

            ultimaFuncionDerechaProcesada =
                null;


            historialDedosDerecha =
                [];

            dedosDerechaEstables =
                null;

            puntoDerechaVisible =
                false;

            tangenteDerechaVisible =
                false;

            derivadaDerechaVisible =
                false;

            retoAplicadoDerechaVisible =
                false;

            puntoCriticoDerechaVisible =
                false;

            posicionPuntoDerechaX =
                null;

            ultimaPosicionPuntoPx = null;
            inicioEstabilidadPunto = null;
            puntoDerechaSeleccionado = false;
            posicionPuntoSeleccionadoX = null;

            posicionRetoAplicadoX =
                null;

            ultimaPosicionRetoPx = null;
            inicioEstabilidadReto = null;
            retoAplicadoSeleccionado = false;
            posicionRetoCandidataX = null;


            rotacionX =
                0;

            rotacionY =
                0;

            rotacionXObjetivo =
                0;

            rotacionYObjetivo =
                0;


            escalaGrafica =
                1;

            escalaGraficaObjetivo =
                1;

            centroVistaX = 0;
            centroVistaY = 0;
            rangoEjeX = rangoInicialEjeX;
            rangoEjeY = rangoInicialEjeY;
            intervaloEjeComunActual = 1;
            arrastreVistaGrafica = null;
            animacionZoomManualEnCurso = false;
            firmaBaseGrafica = null;
            firmaGraficaSolicitada = null;
            lienzoBaseGrafica = null;
            restablecerCuadriculaGrafica();


            modoZoomIzquierda =
                false;

            contadorEntradaZoom =
                0;

            contadorSalidaZoom =
                0;


            funcionActual =
                null;

            funcionTextoActual =
                "";
            arbolDerivadaActual = null;
            arbolSegundaDerivadaActual = null;
            funcionDerivadaActual = null;
            funcionSegundaDerivadaActual = null;
            puntosCriticosActuales = [];
            errorPuntosCriticosActuales = "";

            if (valorEvaluacionX) {
                valorEvaluacionX.value = "";
            }

            if (canvasGrafica) {
                canvasGrafica.style.display = "block";
                const contextoGrafica = canvasGrafica.getContext("2d");
                contextoGrafica?.clearRect(
                    0,
                    0,
                    canvasGrafica.width,
                    canvasGrafica.height
                );
            }

            if (canvasSuperficie3D) {
                canvasSuperficie3D.style.display = "none";
            }


            if (entradaFuncion) {

                entradaFuncion.value =
                    "";
            }


            if (funcionActiva) {

                funcionActiva.textContent =
                    "——————————————";
            }


            if (dominio) {

                dominio.textContent =
                    "Dominio: —————————";
            }


            const mensaje =
                document.querySelector(
                    ".graph-center-message small"
                );


            if (mensaje) {

                mensaje.textContent =
                    "ESPERANDO FUNCIÓN";

                mensaje.closest(".graph-center-message").style.display =
                    "";
            }


            if (estadoFuncion) {
                estadoFuncion.textContent = "LISTO PARA INTERACTUAR";
            }


            if (
                ctx &&
                lienzo
            ) {

                ctx.clearRect(
                    0,
                    0,
                    lienzo.width,
                    lienzo.height
                );
            }


            // El panel se actualiza otra vez ya sin función,
            // para que no quede mostrando la función anterior
            actualizarPanelesInteraccion(0);


        }
    );
}


/* =====================================================
   INICIO
===================================================== */

iniciarMediaPipe();

iniciarSuperficie3D();
