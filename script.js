// URL BASE DE TU API EN JAVA (Modificala cuando la subas a producción)
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Capturamos el token y el evento desde la URL (Ej: ?evento=valen-15&token=baez-789xyz)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const evento = urlParams.get('evento');

/**
 * 🚀 SINCRO: Al cargar la página, validamos que existan los parámetros obligatorios.
 * Si estás usando Thymeleaf para precargar los inputs, bloqueamos el nombre directamente.
 */
document.addEventListener("DOMContentLoaded", () => {
    const inputNombre = document.getElementById('nombre');
    const inputNombreMusica = document.getElementById('nombreInvitado');
    
    // Si la URL no trae parámetros, evitamos el fetch fallido que te tira el alert
    if (!token || !evento) {
        console.warn("Faltan los parámetros 'token' o 'evento' en la URL. El flujo de confirmación asíncrono podría fallar.");
        // Si el backend renderizó el nombre vía Thymeleaf, lo bloqueamos de igual manera
        if (inputNombre && inputNombre.value.trim() !== "") {
            inputNombre.disabled = true;
            if (inputNombreMusica) inputNombreMusica.value = inputNombre.value;
        }
        return; 
    }

    // Sincronizamos datos extra con tu DTO de Java
    fetch(`${API_BASE_URL}/invitados/buscar?slug=${evento}&token=${token}`)
        .then(response => {
            if (!response.ok) throw new Error("Invitado no encontrado en la base de datos");
            return response.json();
        })
        .then(invitado => {
            // Mapeo dinámico: usa el campo exacto que devuelva tu Java DTO
            const nombreFinal = invitado.nombre || invitado.nombreInvitadoPrincipal;

            if (inputNombre && nombreFinal) {
                inputNombre.value = nombreFinal;
                inputNombre.disabled = true; // No lo pueden editar
            }

            if (inputNombreMusica && nombreFinal) {
                inputNombreMusica.value = nombreFinal;
            }
        })
        .catch(error => {
            console.error("Error cargando el invitado desde la API:", error);
            alert("¡Atención! El enlace de la invitación no parece ser válido o no se pudo verificar con el servidor.");
        });
});

/**
 * Lógica para la apertura de la invitación y música
 */
function abrirInvitacion() {
    const audio = document.getElementById('musicaFondo');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('main-content');

    if (audio) {
        audio.play().catch(error => {
            console.log("La reproducción automática fue bloqueada por el navegador.");
        });
    }

    overlay.classList.add('hidden');

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

    if (distancia < 0) {
        clearInterval(countdownX);
        document.getElementById("countdown").innerHTML = "<h3 style='font-family: Playfair Display; color: var(--lacre-color);'>¡HOY ES EL GRAN DÍA!</h3>";
        return;
    }

    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    document.getElementById("days").innerText = dias < 10 ? "0" + dias : dias;
    document.getElementById("hours").innerText = horas < 10 ? "0" + horas : horas;
    document.getElementById("minutes").innerText = minutos < 10 ? "0" + minutos : minutos;
    document.getElementById("seconds").innerText = segundos < 10 ? "0" + segundos : segundos;
}, 1000);

function abrirModal() {
    document.getElementById('modalAsistencia').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('modalAsistencia').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function toggleInvitados() {
    const asiste = document.getElementById('asiste').value;
    const campo = document.getElementById('campoInvitados');
    campo.style.display = (asiste === 'si') ? 'block' : 'none';
}

/**
 * 🔄 MODIFICADO: Guarda la asistencia en Java y luego abre el WhatsApp
 */
function enviarWhatsApp() {
    const asisteValue = document.getElementById('asiste').value;
    const cantidadValue = document.getElementById('cantidad').value;
    const dietaValue = document.getElementById('dieta').value || "Ninguna";
    const nombreInvitado = document.getElementById('nombre').value; 

    if (!token || !evento) {
        alert("Error: No se puede confirmar la asistencia porque el enlace no contiene el token o evento correcto.");
        return;
    }

    // Estructura exacta para tu @RequestBody en Java
    const datosConfirmation = {
        asiste: asisteValue === "si",
        cantidadConfirmados: asisteValue === "si" ? parseInt(cantidadValue) : 0,
        dieta: asisteValue === "si" ? dietaValue : "Ninguna"
    };

    // 1. Guardamos de forma asíncrona en tu backend de Spring Boot
    fetch(`${API_BASE_URL}/invitados/confirmar?slug=${evento}&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosConfirmation)
    })
    .then(response => {
        if (!response.ok) throw new Error("Error al guardar la confirmación");
        return response.json();
    })
    .then(invitadoGuardado => {
        // 2. Si el Back guardó con éxito, procedemos a abrir el WhatsApp
        const telefono = "549123456789"; 
        let mensaje = "";
        
        if (asisteValue === "si") {
            mensaje = `✨ *¡Confirmación de Asistencia!* ✨%0A%0A` +
                      `¡Hola! Soy *${nombreInvitado}* y quería confirmarte que...%0A` +
                      `🌟 *¡SÍ VOY A IR A TUS 15!* 🌟%0A%0A` +
                      `Somos en total: *${cantidadValue}* persona(s) 👨‍👩‍👧‍👦%0A` +
                      `Restricciones alimentarias: *${dietaValue}*%0A%0A` +
                      `¡Qué ganas de que llegue el día! 💖`;
        } else {
            mensaje = `✨ *Notificación de Invitación* ✨%0A%0A` +
                      `¡Hola! Soy *${nombreInvitado}*.%0A` +
                      `Quería contarte que lamentablemente no podré asistir a tu fiesta 😔%0A` +
                      `¡Pero te deseo lo mejor en tu gran noche! ✨`;
        }

        const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${mensaje}`;
        window.open(url, '_blank');
        cerrarModal();
    })
    .catch(error => {
        console.error("Error al sincronizar la asistencia:", error);
        alert("Hubo un problema al registrar tu asistencia en el sistema. Por favor, inténtalo de nuevo.");
    });
}

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

/**
 * 🔄 MODIFICADO: Guarda la canción en tu Base de Datos por Java.
 */
const form = document.getElementById('formMusica');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        if (!evento) {
            alert("No se puede enviar la sugerencia porque falta el identificador del evento.");
            return;
        }

        const btn = document.getElementById('btnEnviarMusica');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        const cancion = document.getElementById('cancionSugerida').value; 
        const nombreOpt = document.getElementById('nombreInvitado').value; 

        const payloadCancion = {
            nombreCancion: cancion,
            artista: nombreOpt 
        };

        // Le pegamos al endpoint de canciones en Java
        fetch(`${API_BASE_URL}/canciones?slug=${evento}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadCancion)
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al sugerir canción");
            
            btn.innerText = "Enviar a la Playlist";
            btn.disabled = false;
            document.getElementById('mensajeExito').style.display = 'block';
            
            // Limpiamos el campo de canción por si quieren sugerir otra
            document.getElementById('cancionSugerida').value = "";
            
            setTimeout(() => {
                document.getElementById('mensajeExito').style.display = 'none';
            }, 5000);
        })
        .catch(error => {
            console.error('Error!', error);
            alert("Hubo un error al enviar la canción a la base de datos.");
            btn.innerText = "Enviar a la Playlist";
            btn.disabled = false;
        });
    });
}

window.addEventListener("load", function() {
    const preloader = document.getElementById("preloader");
    setTimeout(() => {
        if(preloader) preloader.classList.add("loader-hidden");
    }, 1500);
});