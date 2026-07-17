// URL BASE DEL BACKEND CENTRALIZADO EN SPRING BOOT
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Capturamos las variables del inquilino desde la URL (?evento=valen-15&token=baez-789xyz)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const eventoSlug = urlParams.get('evento');

// Variables globales para retener la configuración del invitado que vino del Back
let CONFIG_INVITADO = null;
let EVENTO_ID = null;

/**
 * 1️⃣ INICIALIZACIÓN DINÁMICA DE LA TARJETA
 */
document.addEventListener("DOMContentLoaded", () => {
    // FUNCIÓN DE SEGURIDAD: Si pasan 3.5 segundos y el Back no respondió, apagamos el preloader igual
    setTimeout(() => {
        const preloader = document.getElementById("preloader");
        if (preloader && !preloader.classList.contains("loader-hidden")) {
            console.warn("Sincronización lenta o Backend offline. Forzando apertura del preloader para pruebas.");
            preloader.classList.add("loader-hidden");
        }
    }, 3500);

    // MODO MOCK / DEMOSTRACIÓN: Si falta el token o el evento, cargamos datos de prueba en vez de romper la app
    if (!token || !eventoSlug) {
        console.warn("Ejecutando en modo de prueba local (F5 sin parámetros de URL).");
        
        const datosPrueba = {
            id: 999,
            nombreInvitadoPrincipal: "Alexander Baez (Invitado de Prueba)",
            tipoInvitacion: "NOMINAL",
            cupoMaximoOtorgado: 3,
            evento: {
                id: 10,
                nombreAnfitrion: "Andrea",
                fechaEvento: "2026-11-20T21:00:00",
                aliasCbu: "ANDREA.15.FIESTA"
            }
        };
        
        inyectarDatosEnPantalla(datosPrueba);
        return;
    }

    // Consultamos al Backend Maestro Real
    fetch(`${API_BASE_URL}/invitados/buscar?slug=${eventoSlug}&token=${token}`)
        .then(response => {
            if (!response.ok) throw new Error("Token o Evento inexistente.");
            return response.json();
        })
        .then(data => {
            inyectarDatosEnPantalla(data);
        })
        .catch(error => {
            console.error("Error crítico de sincronización (Backend Offline). Activando respaldo visual:", error);
            const preloader = document.getElementById("preloader");
            if (preloader) preloader.classList.add("loader-hidden");
        });
});

/**
 * 🛠️ FUNCIÓN MAESTRA PARA INYECTAR LA DATA EN EL HTML
 */
function inyectarDatosEnPantalla(data) {
    CONFIG_INVITADO = data;
    EVENTO_ID = data.evento.id;

    // --- INYECTAR DATOS DEL EVENTO ---
    const nombreAnfitrion = data.evento.nombreAnfitrion;
    document.title = `Invitación Oficial | ${nombreAnfitrion}`;
    
    document.querySelectorAll('.txt-anfitrion').forEach(el => el.innerText = nombreAnfitrion);
    document.getElementById('txt-hashtag').innerText = `#${nombreAnfitrion.replace(/\s+/g, '')}2026`;

    const fechaData = new Date(data.evento.fechaEvento);
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fechaData.toLocaleDateString('es-ES', opcionesFecha);
    
    document.getElementById('txt-fecha-hero').innerText = fechaFormateada.toUpperCase();
    document.getElementById('txt-fecha-salon').innerText = `${fechaFormateada} - 21:00 Horas`;

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fiesta+de+${encodeURIComponent(nombreAnfitrion)}&details=¡Te+espero+para+compartir+una+noche+mágica!`;
    document.getElementById('btn-gcalendar').href = gCalUrl;

    document.getElementById('alias-text').innerText = data.evento.aliasCbu || "NO_ASIGNADO";
    document.getElementById('txt-cbu').innerText = `CBU/Datos: ${data.evento.aliasCbu || 'Consultar con el organizador.'}`;

    // --- INYECTAR DATOS DEL INVITADO PRINCIPAL ---
    document.getElementById('nombre').value = data.nombreInvitadoPrincipal;
    document.getElementById('nombreInvitado').value = data.nombreInvitadoPrincipal;

    const firmaFirma = document.querySelector('.final-signature');
    if (firmaFirma) firmaFirma.innerText = nombreAnfitrion;

    document.getElementById('saludo-personalizado').innerHTML = `
        <h3 style="font-family: 'Playfair Display'; font-size: 1.6rem; color: var(--lacre-oscuro); text-align:center;">
            ¡Hola ${data.nombreInvitadoPrincipal}!
        </h3>
        <p class="intro-text" style="text-align:center; font-size:1rem; margin-top:5px;">
            Nos encantaría tenerte con nosotros para disfrutar de esta gran noche.
        </p>
    `;

    armarEstructuraModalAsistencia(data);

    const preloader = document.getElementById("preloader");
    if (preloader) preloader.classList.add("loader-hidden");
}

/**
 * 2️⃣ FUNCIÓN DE APERTURA GLOBAL
 */
function abrirInvitacion() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 500);
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block'; 
        mainContent.style.opacity = '1';
        mainContent.style.visibility = 'visible';
        mainContent.classList.add('active', 'open'); 
    }

    const audio = document.getElementById('musicaFondo');
    if (audio) {
        audio.play().catch(error => {
            console.log("La reproducción automática fue bloqueada por el navegador:", error);
        });
    }
}

/**
 * 3️⃣ CONSTRUCTOR DINÁMICO DEL MODAL RSVP (Corregido de forma segura)
 */
function armarEstructuraModalAsistencia(invitado) {
    const contenedor = document.getElementById('contenedor-dinamico-rsvp');
    contenedor.innerHTML = ""; 

    // Forma segura en Vanilla JS nativo sin extender prototipos prematuramente:
    if (invitado.tipoInvitacion && invitado.tipoInvitacion.toUpperCase() === "NOMINAL") {
        let htmlAcompanantes = `<label style="margin-bottom:10px; display:block; font-weight:600;">Registrar Acompañantes Autorizados (Máx: ${invitado.cupoMaximoOtorgado - 1})</label>`;
        
        for (let i = 1; i < invitado.cupoMaximoOtorgado; i++) {
            htmlAcompanantes += `
                <div class="fila-acompanante" style="display:flex; gap:10px; margin-bottom:10px;">
                    <input type="text" class="ac-nombre" placeholder="Nombre Acompañante ${i}" style="flex:2; padding:8px; border-radius:5px; border:1px solid #ccc;">
                    <input type="text" class="ac-dieta" placeholder="Dieta (opcional)" style="flex:1; padding:8px; border-radius:5px; border:1px solid #ccc;">
                </div>
            `;
        }
        contenedor.innerHTML = htmlAcompanantes;
    } else {
        let opcionesSelect = `<label>¿Cuántas personas asistirán en total?</label>
                              <select id="cantidad" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; font-family: 'Montserrat'; margin-top:5px;">`;
        for (let i = 1; i <= invitado.cupoMaximoOtorgado; i++) {
            opcionesSelect += `<option value="${i}">${i} ${i === 1 ? 'Persona' : 'Personas'}</option>`;
        }
        opcionesSelect += `</select>`;
        contenedor.innerHTML = opcionesSelect;
    }
}

/**
 * 4️⃣ CONTROL VISUAL SEGÚN SELECCIÓN (SI ASISTE / NO ASISTE)
 */
function controlarDespliegueSegunAsistencia() {
    const asisteValue = document.getElementById('asiste').value;
    const contenedor = document.getElementById('contenedor-dinamico-rsvp');
    contenedor.style.display = (asisteValue === 'si') ? 'block' : 'none';
}

/**
 * 5️⃣ ENVÍO ASÍNCRONO DEL RSVP CON FEEDBACK DE ALTISIMA CALIDAD
 */
function enviarWhatsApp() {
    const asisteValue = document.getElementById('asiste').value;
    const dietaGeneral = document.getElementById('dieta').value || "Ninguna";
    const nombreInvitado = document.getElementById('nombre').value;

    let payloadRSVP = {
        asiste: asisteValue === "si",
        dieta: asisteValue === "si" ? dietaGeneral : "Ninguna",
        cantidadConfirmados: 0,
        acompanantes: []
    };

    let resumenWhatsApp = "";

    if (asisteValue === "si") {
        if (CONFIG_INVITADO.tipoInvitacion === "NOMINAL") {
            const filas = document.querySelectorAll('.fila-acompanante');
            filas.forEach(fila => {
                const name = fila.querySelector('.ac-nombre').value.trim();
                const restriction = fila.querySelector('.ac-dieta').value.trim() || "Ninguna";
                
                if (name !== "") {
                    payloadRSVP.acompanantes.push({ nombre: name, dieta: restriction });
                    resumenWhatsApp += `%0A• *${name}* (Dieta: ${restriction})`;
                }
            });
            payloadRSVP.cantidadConfirmados = 1 + payloadRSVP.acompanantes.length;
        } else {
            payloadRSVP.cantidadConfirmados = parseInt(document.getElementById('cantidad').value);
            resumenWhatsApp = `%0A• *Total asistentes:* ${payloadRSVP.cantidadConfirmados} personas`;
        }
    } else {
        payloadRSVP.cantidadConfirmados = 0;
    }

    // Modo Mock local
    if (CONFIG_INVITADO.id === 999) {
        mostrarFeedbackExito(payloadRSVP.asiste, nombreInvitado, asisteValue, resumenWhatsApp, dietaGeneral);
        return;
    }

    // Petición real al Backend Maestro
    fetch(`${API_BASE_URL}/invitados/confirmar?slug=${eventoSlug}&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadRSVP)
    })
    .then(response => {
        if (!response.ok) throw new Error("Error en el servidor.");
        return response.json();
    })
    .then(data => {
        mostrarFeedbackExito(payloadRSVP.asiste, nombreInvitado, asisteValue, resumenWhatsApp, dietaGeneral);
    })
    .catch(error => {
        console.error("Error al registrar RSVP:", error);
        alert("Hubo un inconveniente al guardar tu respuesta. Por favor, reinténtalo.");
    });
}

/**
 * 🌟 MUESTRA EL MODAL DE ÉXITO ELIMINANDO LOS ALERTS ARCAICOS
 */
function mostrarFeedbackExito(isAsiste, nombreInvitado, asisteValue, resumenWhatsApp, dieta) {
    cerrarModal(); // Cerramos el de carga de datos
    
    const titulo = document.getElementById("feedback-titulo");
    const msg = document.getElementById("feedback-mensaje");
    
    if(isAsiste) {
        titulo.innerText = "¡Confirmación Guardada!";
        msg.innerText = "Tu respuesta se registró correctamente en el sistema de la fiesta. ¡Nos alegra mucho contar con vos!";
    } else {
        titulo.innerText = "Respuesta Registrada";
        msg.innerText = "Lamentamos que no puedas asistir. Tu lugar ha sido liberado correctamente.";
    }

    // Configuramos el botón final de WhatsApp dentro del modal
    const btnWA = document.getElementById("btn-finalizar-wa");
    btnWA.onclick = () => {
        procesarRedireccionWhatsApp(nombreInvitado, asisteValue, resumenWhatsApp, dieta);
    };

    // Desplegamos el nuevo modal de confirmación
    document.getElementById('modalFeedback').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function procesarRedireccionWhatsApp(nombreInvitado, asisteValue, resumenWhatsApp, dieta) {
    const telefonoOrganizador = "549123456789"; // Cambialo por el real del cliente
    let mensajeWA = "";

    if (asisteValue === "si") {
        mensajeWA = `✨ *¡Confirmación de Asistencia!* ✨%0A%0A` +
                    `¡Hola! Soy *${nombreInvitado}* y quería confirmarte que...%0A` +
                    `🌟 *¡SÍ VAMOS A IR A TU FIESTA!* 🌟%0A%0A` +
                    `Detalle de Asistencia:${resumenWhatsApp}%0A` +
                    `Restricciones generales: *${dieta}*%0A%0A` +
                    `¡Nos vemos muy pronto! 💖`;
    } else {
        mensajeWA = `✨ *Notificación de Invitación* ✨%0A%0A` +
                    `¡Hola! Soy *${nombreInvitado}*.%0A` +
                    `Quería comentarte que lamentablemente no podremos asistir a tu evento 😔%0A` +
                    `¡Te deseamos el mayor de los éxitos en tu gran noche! ✨`;
    }

    window.open(`https://api.whatsapp.com/send?phone=${telefonoOrganizador}&text=${mensajeWA}`, '_blank');
    cerrarModalFeedback();
}

/**
 * 6️⃣ SUGERENCIAS DE MÚSICA CENTRALIZADAS
 */
const form = document.getElementById('formMusica');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        if (CONFIG_INVITADO && CONFIG_INVITADO.id === 999) {
            document.getElementById('mensajeExito').style.display = 'block';
            document.getElementById('cancionSugerida').value = "";
            setTimeout(() => { document.getElementById('mensajeExito').style.display = 'none'; }, 4000);
            return;
        }

        if (!EVENTO_ID) return;

        const btn = document.getElementById('btnEnviarMusica');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        const cancion = document.getElementById('cancionSugerida').value; 
        const nombreOpt = document.getElementById('nombreInvitado').value; 

        fetch(`${API_BASE_URL}/canciones/evento/${EVENTO_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nombreCancion: cancion, 
                artista: nombreOpt 
            })
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al sugerir tema.");
            btn.innerText = "Enviar a la Playlist";
            btn.disabled = false;
            document.getElementById('mensajeExito').style.display = 'block';
            document.getElementById('cancionSugerida').value = "";
            setTimeout(() => { document.getElementById('mensajeExito').style.display = 'none'; }, 5000);
        })
        .catch(error => {
            console.error('Error地形 enviando canción:', error);
            alert("No se pudo registrar la canción en el sistema.");
            btn.disabled = false;
            btn.innerText = "Enviar a la Playlist";
        });
    });
}

/**
 * 7️⃣ AUXILIARES DE MODALES Y EFECTOS
 */
function abrirModal() { document.getElementById('modalAsistencia').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function cerrarModal() { document.getElementById('modalAsistencia').style.display = 'none'; document.body.style.overflow = 'auto'; }
function abrirModalRegalo() { document.getElementById('modalRegalo').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
function cerrarModalRegalo() { document.getElementById('modalRegalo').style.display = 'none'; document.body.style.overflow = 'auto'; }

function cerrarModalFeedback() { 
    document.getElementById('modalFeedback').style.display = 'none'; 
    document.body.style.overflow = 'auto'; 
    window.location.reload(); // Recarga limpia para actualizar la vista tras confirmar
}

function copiarAlias() {
    const alias = document.getElementById('alias-text').innerText;
    
    // --- MÉTODO CLÁSICO Y SEGURO (Evita que salte el cartel de permisos en móviles) ---
    const elementoTemporal = document.createElement('textarea');
    elementoTemporal.value = alias;
    elementoTemporal.setAttribute('readonly', ''); // Previene que se abra el teclado virtual en móviles
    elementoTemporal.style.position = 'absolute';
    elementoTemporal.style.left = '-9999px'; // Lo sacamos de la pantalla
    document.body.appendChild(elementoTemporal);
    
    // Seleccionamos y copiamos de manera tradicional
    elementoTemporal.select();
    elementoTemporal.setSelectionRange(0, 99999); // Para dispositivos iOS
    
    try {
        document.execCommand('copy'); // Ejecuta la copia sin pedir permisos de sistema
        
        // Efecto visual de éxito en el botón
        const btn = document.querySelector('.btn-copy');
        if (btn) {
            btn.innerText = "¡COPIADO!";
            btn.style.background = "#2ecc71";
            btn.style.color = "white";
            setTimeout(() => {
                btn.innerText = "COPIAR ALIAS";
                btn.style.background = "var(--oro)";
                btn.style.color = "var(--lacre-oscuro)";
            }, 2000);
        }
    } catch (err) {
        console.error("No se pudo copiar el alias automáticamente: ", err);
    }
    
    // Eliminamos el elemento del DOM
    document.body.removeChild(elementoTemporal);
}