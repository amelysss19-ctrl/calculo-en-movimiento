/* =====================================================
   FONDO ESPACIAL

   - Dibuja estrellas, nebulosas y la Vía Láctea en un
     canvas UNA sola vez (y otra vez solo si cambia el
     tamaño de la ventana). No gasta recursos en cada frame.
   - Dibuja una galaxia espiral que luego gira con CSS.
   - Crea algunas estrellas que titilan (animación CSS).
   - Efecto de profundidad (parallax) al mover el mouse.

   Este archivo es independiente de script.js: si fallara,
   la aplicación matemática sigue funcionando igual.
===================================================== */

(function () {

    const fondo = document.querySelector(".space-background");
    const lienzoEstrellas = document.getElementById("campoEstrellas");
    const lienzoGalaxia = document.getElementById("lienzoGalaxia");
    const capaDestellos = document.getElementById("destellosEstrellas");

    const movimientoReducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;


    /* -------------------------------------------------
       NÚMEROS ALEATORIOS CON SEMILLA
       Con la misma semilla sale siempre el mismo cielo.
    ------------------------------------------------- */

    function crearAleatorio(semilla) {

        return function () {
            semilla = (semilla + 0x6d2b79f5) | 0;

            let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Valor entre −1 y 1, casi siempre cerca de 0 (forma de campana)
    function gaussiana(aleatorio) {
        return (aleatorio() + aleatorio() + aleatorio() + aleatorio() - 2) / 2;
    }

    const coloresEstrellas = [
        "255, 255, 255",
        "255, 255, 255",
        "214, 232, 255",
        "180, 210, 255",
        "255, 238, 214",
        "255, 214, 176",
        "214, 196, 255"
    ];

    function colorAleatorio(aleatorio) {
        return coloresEstrellas[
            Math.floor(aleatorio() * coloresEstrellas.length)
        ];
    }


    /* -------------------------------------------------
       PIEZAS DE DIBUJO
    ------------------------------------------------- */

    function dibujarPunto(contexto, x, y, radio, color, alfa) {

        contexto.fillStyle = `rgba(${color}, ${alfa})`;
        contexto.beginPath();
        contexto.arc(x, y, radio, 0, Math.PI * 2);
        contexto.fill();
    }

    function dibujarMancha(contexto, x, y, radio, color, alfa) {

        const degradado = contexto.createRadialGradient(x, y, 0, x, y, radio);
        degradado.addColorStop(0, `rgba(${color}, ${alfa})`);
        degradado.addColorStop(0.45, `rgba(${color}, ${alfa * 0.45})`);
        degradado.addColorStop(1, `rgba(${color}, 0)`);

        contexto.fillStyle = degradado;
        contexto.fillRect(x - radio, y - radio, radio * 2, radio * 2);
    }

    function dibujarEstrellaBrillante(contexto, x, y, radio, color, conDestellos) {

        // Halo suave alrededor de la estrella
        const alcance = radio * 7;
        const halo = contexto.createRadialGradient(x, y, 0, x, y, alcance);
        halo.addColorStop(0, `rgba(${color}, 0.9)`);
        halo.addColorStop(0.12, `rgba(${color}, 0.35)`);
        halo.addColorStop(0.4, `rgba(${color}, 0.08)`);
        halo.addColorStop(1, `rgba(${color}, 0)`);

        contexto.fillStyle = halo;
        contexto.fillRect(x - alcance, y - alcance, alcance * 2, alcance * 2);

        // Destellos en cruz, como en las fotos de telescopio
        if (conDestellos) {
            const largo = radio * 14;

            for (const [dx, dy] of [[1, 0], [0, 1]]) {
                const linea = contexto.createLinearGradient(
                    x - dx * largo, y - dy * largo,
                    x + dx * largo, y + dy * largo
                );
                linea.addColorStop(0, `rgba(${color}, 0)`);
                linea.addColorStop(0.5, `rgba(${color}, 0.55)`);
                linea.addColorStop(1, `rgba(${color}, 0)`);

                contexto.strokeStyle = linea;
                contexto.lineWidth = 0.8;
                contexto.beginPath();
                contexto.moveTo(x - dx * largo, y - dy * largo);
                contexto.lineTo(x + dx * largo, y + dy * largo);
                contexto.stroke();
            }
        }

        dibujarPunto(contexto, x, y, radio * 0.6, "255, 255, 255", 1);
    }

    function dibujarNebulosa(contexto, aleatorio, nebulosa) {

        // Muchas manchas de luz muy suaves forman una nube
        contexto.save();
        contexto.globalCompositeOperation = "screen";

        for (let i = 0; i < nebulosa.manchas; i++) {
            dibujarMancha(
                contexto,
                nebulosa.x + gaussiana(aleatorio) * nebulosa.ancho,
                nebulosa.y + gaussiana(aleatorio) * nebulosa.alto,
                nebulosa.radio * (0.35 + aleatorio() * 0.65),
                nebulosa.color,
                nebulosa.intensidad * (0.4 + aleatorio() * 0.6)
            );
        }

        contexto.restore();
    }

    function dibujarViaLactea(contexto, aleatorio, ancho, alto) {

        // Banda diagonal de la galaxia, de abajo-izquierda a arriba-derecha
        const inicio = { x: -0.1 * ancho, y: 0.92 * alto };
        const fin = { x: 1.1 * ancho, y: 0.06 * alto };
        const dx = fin.x - inicio.x;
        const dy = fin.y - inicio.y;
        const largo = Math.hypot(dx, dy);
        const normalX = -dy / largo;
        const normalY = dx / largo;
        const grosor = Math.min(ancho, alto) * 0.16;

        const puntoEnBanda = (t, desvio) => ({
            x: inicio.x + dx * t + normalX * desvio,
            y: inicio.y + dy * t + normalY * desvio
        });

        // 1. Brillo difuso
        contexto.save();
        contexto.globalCompositeOperation = "screen";

        for (let i = 0; i < 70; i++) {
            const punto = puntoEnBanda(
                aleatorio(),
                gaussiana(aleatorio) * grosor * 0.6
            );
            const color =
                aleatorio() < 0.35
                    ? "255, 214, 190"
                    : aleatorio() < 0.5
                        ? "150, 170, 255"
                        : "180, 150, 255";

            dibujarMancha(
                contexto,
                punto.x,
                punto.y,
                grosor * (0.5 + aleatorio() * 0.9),
                color,
                0.045
            );
        }

        contexto.restore();

        // 2. Polvo oscuro en el centro de la banda
        for (let i = 0; i < 40; i++) {
            const punto = puntoEnBanda(
                aleatorio(),
                gaussiana(aleatorio) * grosor * 0.25
            );

            dibujarMancha(
                contexto,
                punto.x,
                punto.y,
                grosor * (0.18 + aleatorio() * 0.35),
                "2, 4, 12",
                0.22
            );
        }

        // 3. Miles de estrellas diminutas concentradas en la banda
        const cantidad = Math.round((ancho * alto) / 650);

        for (let i = 0; i < cantidad; i++) {
            const punto = puntoEnBanda(
                aleatorio(),
                gaussiana(aleatorio) * grosor
            );

            dibujarPunto(
                contexto,
                punto.x,
                punto.y,
                0.3 + aleatorio() * 0.55,
                colorAleatorio(aleatorio),
                0.2 + aleatorio() * 0.55
            );
        }
    }


    /* -------------------------------------------------
       CAMPO DE ESTRELLAS COMPLETO
    ------------------------------------------------- */

    function dibujarCampoEstrellas() {

        if (!lienzoEstrellas) {
            return;
        }

        const contexto = lienzoEstrellas.getContext("2d");

        if (!contexto) {
            return;
        }

        const ancho = window.innerWidth;
        const alto = window.innerHeight;
        const escala = Math.min(window.devicePixelRatio || 1, 2);

        lienzoEstrellas.width = Math.round(ancho * escala);
        lienzoEstrellas.height = Math.round(alto * escala);

        contexto.setTransform(escala, 0, 0, escala, 0, 0);
        contexto.clearRect(0, 0, ancho, alto);

        const aleatorio = crearAleatorio(2026);
        const minimo = Math.min(ancho, alto);
        const area = ancho * alto;

        // Nebulosas de colores (muy suaves para no molestar al leer)
        const nebulosas = [
            { x: 0.12, y: 0.22, ancho: 0.16, alto: 0.14, radio: 0.34, color: "120, 60, 220", intensidad: 0.09, manchas: 26 },
            { x: 0.86, y: 0.5, ancho: 0.12, alto: 0.2, radio: 0.3, color: "30, 120, 255", intensidad: 0.08, manchas: 24 },
            { x: 0.72, y: 0.2, ancho: 0.1, alto: 0.1, radio: 0.22, color: "220, 70, 180", intensidad: 0.055, manchas: 18 },
            { x: 0.28, y: 0.7, ancho: 0.14, alto: 0.1, radio: 0.28, color: "0, 180, 210", intensidad: 0.06, manchas: 20 },
            { x: 0.5, y: 0.38, ancho: 0.2, alto: 0.12, radio: 0.4, color: "60, 80, 200", intensidad: 0.035, manchas: 16 }
        ];

        for (const nebulosa of nebulosas) {
            dibujarNebulosa(contexto, aleatorio, {
                ...nebulosa,
                x: nebulosa.x * ancho,
                y: nebulosa.y * alto,
                ancho: nebulosa.ancho * ancho,
                alto: nebulosa.alto * alto,
                radio: nebulosa.radio * minimo
            });
        }

        dibujarViaLactea(contexto, aleatorio, ancho, alto);

        // Estrellas lejanas: muchas y tenues
        for (let i = 0, total = Math.round(area / 1400); i < total; i++) {
            dibujarPunto(
                contexto,
                aleatorio() * ancho,
                aleatorio() * alto,
                0.25 + aleatorio() * 0.45,
                colorAleatorio(aleatorio),
                0.25 + aleatorio() * 0.5
            );
        }

        // Estrellas medianas
        for (let i = 0, total = Math.round(area / 7000); i < total; i++) {
            dibujarPunto(
                contexto,
                aleatorio() * ancho,
                aleatorio() * alto,
                0.6 + aleatorio() * 0.5,
                colorAleatorio(aleatorio),
                0.55 + aleatorio() * 0.4
            );
        }

        // Estrellas brillantes y cercanas, algunas con destellos
        for (let i = 0, total = Math.max(10, Math.round(area / 45000)); i < total; i++) {
            dibujarEstrellaBrillante(
                contexto,
                aleatorio() * ancho,
                aleatorio() * alto,
                0.9 + aleatorio() * 0.9,
                colorAleatorio(aleatorio),
                aleatorio() < 0.3
            );
        }
    }


    /* -------------------------------------------------
       GALAXIA ESPIRAL (el giro lo hace el CSS)
    ------------------------------------------------- */

    function dibujarGalaxia() {

        if (!lienzoGalaxia) {
            return;
        }

        const contexto = lienzoGalaxia.getContext("2d");

        if (!contexto) {
            return;
        }

        const tamano = 260;
        const escala = Math.min(window.devicePixelRatio || 1, 2);
        const centro = tamano / 2;
        const aleatorio = crearAleatorio(77);

        lienzoGalaxia.width = tamano * escala;
        lienzoGalaxia.height = tamano * escala;
        contexto.setTransform(escala, 0, 0, escala, 0, 0);

        // Núcleo brillante y halo
        const halo = contexto.createRadialGradient(
            centro, centro, 0,
            centro, centro, centro
        );
        halo.addColorStop(0, "rgba(255, 240, 220, 0.95)");
        halo.addColorStop(0.06, "rgba(255, 214, 170, 0.6)");
        halo.addColorStop(0.22, "rgba(170, 150, 255, 0.16)");
        halo.addColorStop(0.6, "rgba(110, 120, 255, 0.05)");
        halo.addColorStop(1, "rgba(80, 90, 220, 0)");

        contexto.fillStyle = halo;
        contexto.fillRect(0, 0, tamano, tamano);

        // Dos brazos en espiral hechos con miles de puntitos
        contexto.globalCompositeOperation = "screen";

        for (let brazo = 0; brazo < 2; brazo++) {
            for (let i = 0; i < 1100; i++) {
                const t = Math.pow(aleatorio(), 0.8);
                const angulo = brazo * Math.PI + t * Math.PI * 2.4;
                const radio = 8 + t * (centro - 16);
                const desvio = gaussiana(aleatorio) * (5 + t * 14);
                const x = centro + Math.cos(angulo) * radio - Math.sin(angulo) * desvio;
                const y = centro + Math.sin(angulo) * radio + Math.cos(angulo) * desvio;
                const color =
                    t < 0.3
                        ? "255, 226, 196"
                        : aleatorio() < 0.2
                            ? "255, 160, 220"
                            : "170, 196, 255";
                const lado = 0.6 + aleatorio() * 1.1;

                contexto.fillStyle = `rgba(${color}, ${0.15 + (1 - t) * 0.55})`;
                contexto.fillRect(x, y, lado, lado);
            }
        }
    }


    /* -------------------------------------------------
       ESTRELLAS QUE TITILAN
    ------------------------------------------------- */

    function crearDestellos() {

        if (!capaDestellos) {
            return;
        }

        const aleatorio = crearAleatorio(99);
        const grupo = document.createDocumentFragment();

        for (let i = 0; i < 26; i++) {
            const destello = document.createElement("span");
            destello.className = "destello";

            // No se ponen sobre la Tierra (parte de abajo)
            destello.style.left = (aleatorio() * 100).toFixed(2) + "%";
            destello.style.top = (aleatorio() * 76).toFixed(2) + "%";
            destello.style.setProperty("--tamano", (4 + aleatorio() * 7).toFixed(1) + "px");
            destello.style.setProperty("--duracion", (2.5 + aleatorio() * 4).toFixed(2) + "s");
            destello.style.setProperty("--retraso", (-aleatorio() * 6).toFixed(2) + "s");

            grupo.appendChild(destello);
        }

        capaDestellos.appendChild(grupo);
    }


    /* -------------------------------------------------
       PROFUNDIDAD CON EL MOUSE (PARALLAX)
       Solo cambia dos variables CSS; el movimiento lo
       hace la tarjeta gráfica con "transform".
    ------------------------------------------------- */

    function activarParallax() {

        if (!fondo || movimientoReducido) {
            return;
        }

        let esperandoFrame = false;
        let ultimoEvento = null;

        window.addEventListener(
            "pointermove",
            function (evento) {
                ultimoEvento = evento;

                if (esperandoFrame) {
                    return;
                }

                esperandoFrame = true;

                requestAnimationFrame(function () {
                    esperandoFrame = false;

                    const x = ultimoEvento.clientX / window.innerWidth - 0.5;
                    const y = ultimoEvento.clientY / window.innerHeight - 0.5;

                    fondo.style.setProperty("--parallax-x", x.toFixed(3));
                    fondo.style.setProperty("--parallax-y", y.toFixed(3));
                });
            },
            { passive: true }
        );
    }


    /* -------------------------------------------------
       INICIO
    ------------------------------------------------- */

    dibujarCampoEstrellas();
    dibujarGalaxia();
    crearDestellos();
    activarParallax();

    // Al cambiar el tamaño de la ventana se vuelve a dibujar el cielo
    // (con una pequeña espera para no dibujar muchas veces seguidas)
    let temporizadorRedimension = null;

    window.addEventListener("resize", function () {
        clearTimeout(temporizadorRedimension);
        temporizadorRedimension = setTimeout(dibujarCampoEstrellas, 200);
    });

})();
