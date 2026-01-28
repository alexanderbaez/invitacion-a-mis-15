/**
 * Lógica para la apertura de la invitación y música
 */
function abrirInvitacion() {
    const audio = document.getElementById('musicaFondo');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('main-content');

    // Intentar reproducir el audio (se dispara por interacción del usuario)
    if (audio) {
        audio.play().catch(error => {
            console.log("La reproducción automática fue bloqueada por el navegador o falta el archivo.");
        });
    }

    // Ocultar el sobre con la transición CSS
    overlay.classList.add('hidden');

    // Habilitar scroll y mostrar contenido después de la animación
    setTimeout(() => {
        content.classList.add('visible');
        document.body.style.overflow = 'auto';
    }, 800);
}

/**
 * Lógica de la Cuenta Regresiva
 */
const fechaFiesta = new Date("June 20, 2026 21:00:00").getTime();

const countdownX = setInterval(function() {
    const ahora = new Date().getTime();
    const distancia = fechaFiesta - ahora;

    // Si la fecha ya pasó
    if (distancia < 0) {
        clearInterval(countdownX);
        document.getElementById("countdown").innerHTML = "<h3 style='font-family: Playfair Display; color: var(--lacre-color);'>¡HOY ES EL GRAN DÍA!</h3>";
        return;
    }

    // Cálculos de tiempo
    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    // Renderizado en el HTML con formato de dos dígitos
    document.getElementById("days").innerText = dias < 10 ? "0" + dias : dias;
    document.getElementById("hours").innerText = horas < 10 ? "0" + horas : horas;
    document.getElementById("minutes").innerText = minutos < 10 ? "0" + minutos : minutos;
    document.getElementById("seconds").innerText = segundos < 10 ? "0" + segundos : segundos;
}, 1000);

function abrirModal() {
    document.getElementById('modalAsistencia').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evita scroll al estar abierto
}

function cerrarModal() {
    document.getElementById('modalAsistencia').style.display = 'none';
    document.body.style.overflow = 'auto'; // Devuelve el scroll
}
// Función para mostrar/ocultar cantidad de personas
function toggleInvitados() {
    const asiste = document.getElementById('asiste').value;
    const campo = document.getElementById('campoInvitados');
    campo.style.display = (asiste === 'si') ? 'block' : 'none';
}

function enviarWhatsApp() {
    // Reemplaza con el número de teléfono de la quinceañera (con código de país, ej: 549...)
    const telefono = "549123456789"; 
    
    const nombre = document.getElementById('nombre').value;
    const asiste = document.getElementById('asiste').value;
    const cantidad = document.getElementById('cantidad').value;
    const dieta = document.getElementById('dieta').value || "Ninguna";

    if (!nombre) {
        alert("Por favor, pon tu nombre.");
        return;
    }

    let mensaje = "";
    
    if (asiste === "si") {
        mensaje = `✨ *¡Confirmación de Asistencia!* ✨%0A%0A` +
                  `Hola! Soy *${nombre}* y quería confirmarte que...%0A` +
                  `🌟 *¡SÍ VOY A IR A TUS 15!* 🌟%0A%0A` +
                  `Somos en total: *${cantidad}* persona(s) 👨‍👩‍👧‍👦%0A` +
                  `Observaciones: ${dieta}%0A%0A` +
                  `¡Qué ganas de que llegue el día! 💖`;
    } else {
        mensaje = `✨ *Notificación de Invitación* ✨%0A%0A` +
                  `Hola! Soy *${nombre}*.%0A` +
                  `Quería contarte que lamentablemente no podré asistir a tu fiesta 😔%0A` +
                  `¡Pero te deseo lo mejor en tu gran noche! ✨`;
    }

    const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${mensaje}`;
    window.open(url, '_blank');
}

// Asegurate de tener estas funciones en tu JS
function abrirModalRegalo() {
    document.getElementById('modalRegalo').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModalRegalo() {
    document.getElementById('modalRegalo').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function copiarAlias() {
    const alias = document.getElementById('alias-text').innerText;
    navigator.clipboard.writeText(alias).then(() => {
        // Cambiamos el texto del botón momentáneamente para avisar que se copió
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.innerText;
        btn.innerText = "¡COPIADO!";
        btn.style.background = "#2ecc71";
        btn.style.color = "white";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "var(--oro)";
            btn.style.color = "var(--lacre-oscuro)";
        }, 2000);
    });
}

const scriptURL = 'https://script.google.com/macros/s/AKfycbxi7Sc00lgdnlVHttQ5BY773sS9f2l8IC8qMCgIlCcniQ9S1bYF32DVuZCPpbKcMFH1/exec'; // Pegá acá la URL que copiaste en el Paso 1
const form = document.getElementById('formMusica');

form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviarMusica');
    btn.innerText = "Enviando...";
    btn.disabled = true;

    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
        .then(response => {
            btn.innerText = "Enviar a la Playlist";
            btn.disabled = false;
            document.getElementById('mensajeExito').style.display = 'block';
            form.reset();
            setTimeout(() => {
                document.getElementById('mensajeExito').style.display = 'none';
            }, 5000);
        })
        .catch(error => {
            console.error('Error!', error.message);
            alert("Hubo un error al enviar. Intenta de nuevo.");
            btn.disabled = false;
        });
});

window.addEventListener("load", function() {
    const preloader = document.getElementById("preloader");
    setTimeout(() => {
        preloader.classList.add("loader-hidden");
    }, 1500); // 1.5 segundos para que se aprecie la elegancia
});