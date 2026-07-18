// ============================================================================
// 🗺️ CONFIGURACIÓN GLOBAL Y PARSEO DE URL
// ============================================================================

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
 * Se ejecuta apenas el navegador procesa el HTML estructurado.
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
            cupoMaximoOtorgado: 5,
            amountConfirmados: 0, // Simula que inicia sin confirmar
            evento: {
                id: 10,
                nombreAnfitrion: "Andrea",
                fechaEvento: "2026-11-20T21:00:00", // Formato ISO
                aliasCbu: "ANDREA.15.FIESTA",
                telefonoOrganizador: "549123456789"
            }
        };
        
        inyectarDatosEnPantalla(datosPrueba);
        return;
    }

    // Consultamos al Backend Maestro Real enviando las credenciales de la URL
    fetch(`${API_BASE_URL}/invitados/buscar?slug=${eventoSlug}&token=${token}`)
        .then(response => {
            if (!response.ok) throw new Error("Token o Evento inexistente.");
            return response.json();
        })
        .then(data => {
            // Si el backend responde, llamamos a la función constructora en pantalla
            inyectarDatosEnPantalla(data);
        })
        .catch(error => {
            console.error("Error crítico de sincronización (Backend Offline). Activando respaldo visual:", error);
            const preloader = document.getElementById("preloader");
            if (preloader) preloader.classList.add("loader-hidden");
        });

    // Vincular el botón de descarga con el renderizador blindado en el Iframe
    const btnDescargar = document.getElementById('btnDescargarPasePNG');
    if (btnDescargar) {
        btnDescargar.addEventListener('click', descargarPaseBlindado);
    }
});

/**
 * 🛠️ FUNCIÓN MAESTRA PARA INYECTAR LA DATA EN EL HTML
 * Distribuye todos los nombres, textos, fechas y configura el comportamiento inicial.
 */
function inyectarDatosEnPantalla(data) {
    CONFIG_INVITADO = data;
    EVENTO_ID = data.evento.id;

    // --- INYECTAR DATOS DEL EVENTO ---
    const nombreAnfitrion = data.evento.nombreAnfitrion;
    document.title = `Invitación Oficial | ${nombreAnfitrion}`;
    
    // Inyecta el nombre de la quinceañera/novios en todas las clases correspondientes
    document.querySelectorAll('.txt-anfitrion').forEach(el => el.innerText = nombreAnfitrion);
    document.getElementById('txt-hashtag').innerText = `#${nombreAnfitrion.replace(/\s+/g, '')}2026`;

    // Procesamiento y formateado automático de fechas de la base de datos
    const fechaData = new Date(data.evento.fechaEvento);
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fechaData.toLocaleDateString('es-ES', opcionesFecha);
    
    // Renderiza las fechas en mayúsculas para los banners principales
    document.getElementById('txt-fecha-hero').innerText = fechaFormateada.toUpperCase();
    document.getElementById('txt-fecha-salon').innerText = `${fechaFormateada} - 21:00 Horas`;

    // CORRECCIÓN DEL LINK DE GOOGLE CALENDAR
    const formatGCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const fechaInicioGCal = formatGCalDate(fechaData);
    
    // Calcula la finalización del evento sumándole 4 horas por defecto
    const fechaFinData = new Date(fechaData.getTime() + (4 * 60 * 60 * 1000));
    const fechaFinGCal = formatGCalDate(fechaFinData);

    // Construye el enlace dinámico para que el invitado agende la fiesta en su calendario de Google
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Fiesta+de+${encodeURIComponent(nombreAnfitrion)}&dates=${fechaInicioGCal}/${fechaFinGCal}&details=¡Te+espero+para+compartir+una+noche+mágica!`;
    document.getElementById('btn-gcalendar').href = gCalUrl;

    // Muestra los datos financieros guardados en la BD
    document.getElementById('alias-text').innerText = data.evento.aliasCbu || "NO_ASIGNADO";
    document.getElementById('txt-cbu').innerText = `CBU/Datos: ${data.evento.aliasCbu || 'Consultar con el organizador.'}`;

    // --- INYECTAR DATOS DEL INVITADO PRINCIPAL ---
    if(document.getElementById('nombre')) document.getElementById('nombre').value = data.nombreInvitadoPrincipal;
    if(document.getElementById('nombreInvitado')) document.getElementById('nombreInvitado').value = data.nombreInvitadoPrincipal;

    // Coloca la firma del anfitrión al pie de la invitación
    const firmaFirma = document.querySelector('.final-signature');
    if (firmaFirma) firmaFirma.innerText = nombreAnfitrion;

    // Renderiza el bloque central de bienvenida personalizada
    const saludoPersonalizado = document.getElementById('saludo-personalizado');
    if (saludoPersonalizado) {
        saludoPersonalizado.innerHTML = `
            <h3 style="font-family: 'Playfair Display'; font-size: 1.6rem; color: var(--lacre-oscuro); text-align:center;">
                ¡Hola ${data.nombreInvitadoPrincipal}!
            </h3>
            <p class="intro-text" style="text-align:center; font-size:1rem; margin-top:5px;">
                Nos encantaría tenerte con nosotros para disfrutar de esta gran noche.
            </p>
        `;
    }

    // Diseña la lógica interna del modal de asistencia (Si es por lista nominal o numérica)
    armarEstructuraModalAsistencia(data);

    // ============================================================================
    // 🚀 DETECTOR BLINDADO INTERCEPTOR: MODO PASE VIP DIRECTO
    // ============================================================================
    if (data.cantidadConfirmados && parseInt(data.cantidadConfirmados) > 0) {
        console.log("🔥 [MODO PASE DETECTADO] Forzando renderizado exclusivo del QR y apagando el layout base.");
        
        // 1. Desactivamos el preloader de carga
        const preloader = document.getElementById("preloader");
        if (preloader) preloader.classList.add("loader-hidden");

        // 2. Quitamos el sobre inicial
        const overlay = document.getElementById('overlay');
        if (overlay) overlay.style.display = 'none';
        
        // 3. Ocultamos por completo el cuerpo principal de la tarjeta de invitación
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none'; 
            mainContent.style.opacity = '0';
            mainContent.style.visibility = 'hidden';
        }

        // 4. Limpieza de elementos huérfanos fuera de main-content (como firmas fijas o secciones de firmas)
        document.querySelectorAll('.final-signature, footer, section, .creative-developer, center').forEach(elemento => {
            // Evaluamos que no sea hijo ni contenga al modal del QR antes de apagarlo
            if (!elemento.contains(document.getElementById('modalTicketQR'))) {
                elemento.style.display = 'none';
                elemento.style.visibility = 'hidden';
                elemento.style.opacity = '0';
            }
        });

        // 5. Adaptamos el lienzo base del body
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.backgroundImage = 'none';

        // 6. Ejecutamos la apertura táctica de la tarjeta QR
        abrirModalTicketQR(data);
        return; 
    }

    // Fin del circuito regular
    const preloader = document.getElementById("preloader");
    if (preloader) preloader.classList.add("loader-hidden");
}

/**
 * 🎫 FUNCIÓN PARA POPULAR Y MOSTRAR EL MODAL DEL TICKET QR INTERACTIVO
 * SOLUCIÓN DE COEXISTENCIA: Resetea clases CSS y fuerza inyección en la capa superior absoluta.
 */
function abrirModalTicketQR(invitado) {
    const modalQR = document.getElementById('modalTicketQR');
    if (!modalQR) {
        console.error("No se encontró el contenedor con ID 'modalTicketQR' en el DOM.");
        return;
    }

    // Asignamos textos dinámicos a la tarjeta VIP dentro del modal
    const qrTicketNombre = document.getElementById('qrTicketNombre');
    const qrTicketCupo = document.getElementById('qrTicketCupo');
    const qrTicketImg = document.getElementById('qrTicketImg');

    if (qrTicketNombre) qrTicketNombre.innerText = invitado.nombreInvitadoPrincipal;
    if (qrTicketCupo) qrTicketCupo.innerText = `${invitado.cantidadConfirmados} ${invitado.cantidadConfirmados === 1 ? 'pase' : 'pases'}`;
    
    // Solución del bloqueo de CORS interceptando el origen de la imagen externa
    if (qrTicketImg && token) {
        qrTicketImg.removeAttribute('src'); 
        
        const urlQrExterna = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(token)}`;
        
        fetch(urlQrExterna)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    qrTicketImg.src = reader.result; 
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                console.error("Error al capear CORS del QR:", err);
                qrTicketImg.crossOrigin = "anonymous";
                qrTicketImg.src = urlQrExterna;
            });
    }

    // ============================================================================
    // 🛡️ RESETEO Y CONFIGURACIÓN INAPELABLE DE ESTILOS POR JAVASCRIPT
    // ============================================================================
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'none';

    // Limpiamos las clases previas de Tailwind que puedan forzar opacidad 0 o escala 0
    modalQR.className = ''; 
    
    // Inyectamos estilos en línea con máxima jerarquía
    modalQR.style.position = 'fixed';
    modalQR.style.top = '0';
    modalQR.style.left = '0';
    modalQR.style.width = '100vw';
    modalQR.style.height = '100vh';
    modalQR.style.display = 'flex';
    modalQR.style.flexDirection = 'column';
    modalQR.style.justifyContent = 'center';
    modalQR.style.alignItems = 'center';
    modalQR.style.zIndex = '2147483647'; // El z-index máximo permitido en navegadores de 32 bits
    modalQR.style.backgroundColor = '#f8fafc'; 
    modalQR.style.opacity = '1';
    modalQR.style.visibility = 'visible';
    modalQR.style.transform = 'none';

    // Aseguramos que los contenedores hijos inmediatos del modal sean visibles
    const tarjetaInterna = document.getElementById('tarjetaVipContenedor') || modalQR.firstElementChild;
    if (tarjetaInterna) {
        tarjetaInterna.style.display = 'block';
        tarjetaInterna.style.opacity = '1';
        tarjetaInterna.style.visibility = 'visible';
        tarjetaInterna.style.transform = 'none';
    }

    document.body.style.overflow = 'hidden';
}

/**
 * 📸 RENDERIZADOR BLINDADO CONTRA ERRORES OKLCH (USANDO IFRAME SANDBOX)
 * Duplica la tarjeta en un entorno virtual aislado para fotografiarla limpiamente con html2canvas.
 */
function descargarPaseBlindado() {
    const tarjetaOriginal = document.getElementById('tarjetaVipContenedor');
    const btnDescargar = document.getElementById('btnDescargarPasePNG');
    const nombreInvitado = CONFIG_INVITADO ? CONFIG_INVITADO.nombreInvitadoPrincipal.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'invitado';

    if (!tarjetaOriginal) return;
    if (typeof html2canvas === 'undefined') {
        alert("La librería html2canvas no está disponible.");
        return;
    }

    const textoOriginal = btnDescargar.innerHTML;
    btnDescargar.innerHTML = "Procesando...";
    btnDescargar.disabled = true;

    // 1. Creamos un iframe en blanco (Sandbox) para aislar por completo el DOM de Tailwind v4 y sus colores experimentales
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '400px';
    iframe.style.height = '700px';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const docIframe = iframe.contentDocument || iframe.contentWindow.document;

    // 2. Clonamos los estilos internos e inyectamos la estructura limpia sin variables oklch globales
    const clonTarjeta = tarjetaOriginal.cloneNode(true);
    
    // Quitamos los botones internos del clon para que no salgan impresos en la foto descargada
    const contenedorBotones = clonTarjeta.querySelector('.flex.flex-col.gap-2') || clonTarjeta.querySelector('button')?.parentNode;
    if (contenedorBotones && contenedorBotones !== clonTarjeta) {
        contenedorBotones.remove();
    }

    docIframe.open();
    docIframe.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 20px; background-color: #f8fafc; display: flex; justify-content: center; }
                #tarjetaVipContenedor {
                    background: #ffffff !important;
                    border-radius: 24px !important;
                    padding: 24px !important;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
                    width: 340px !important;
                    text-align: center !important;
                    font-family: 'Montserrat', sans-serif !important;
                }
            </style>
        </head>
        <body>
            <div id="render-target"></div>
        </body>
        </html>
    `);
    docIframe.close();

    // 3. Insertamos el clon en el entorno limpio del iframe
    docIframe.getElementById('render-target').appendChild(clonTarjeta);

    // 4. Ejecutamos html2canvas apuntando directamente al entorno aislado del Iframe
    setTimeout(() => {
        iframe.contentWindow.html2canvas(clonTarjeta, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#f8fafc"
        }).then(canvas => {
            const blobData = canvas.toDataURL("image/png");
            const enlaceDescarga = document.createElement('a');
            enlaceDescarga.download = `pase_${nombreInvitado}.png`;
            enlaceDescarga.href = blobData;
            enlaceDescarga.click();

            // Limpieza del árbol DOM y restauración del estado del botón
            iframe.remove();
            btnDescargar.innerHTML = textoOriginal;
            btnDescargar.disabled = false;
        }).catch(err => {
            console.error("Error en renderizado aislado:", err);
            alert("No se pudo procesar la imagen del pase.");
            iframe.remove();
            btnDescargar.innerHTML = textoOriginal;
            btnDescargar.disabled = false;
        });
    }, 250);
}

/**
 * 3️⃣ CONSTRUCTOR DINÁMICO DEL MODAL RSVP (Confirmación de asistencia)
 * Arma las entradas de texto correspondientes según el tipo de invitación configurada desde el backend.
 */
function armarEstructuraModalAsistencia(invitado) {
    const contenedor = document.getElementById('contenedor-dinamico-rsvp');
    if (!contenedor) return;
    contenedor.innerHTML = ""; 

    // CASO DE USO NOMINAL: Se solicita de forma individual nombre y apellido de cada acompañante
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
        // CASO DE USO GLOBAL/NUMÉRICO: Despliega un menú Select de números planos simple
        let opcionesSelect = `<label style="font-weight:600;">¿Cuántas personas asistirán en total?</label>
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
 * Oculta el listado de acompañantes si el usuario selecciona que no asistirá al evento.
 */
function controllingDespliegueSegunAsistencia() {
    const elAsiste = document.getElementById('asiste');
    if (!elAsiste) return;
    const asisteValue = elAsiste.value;
    const contenedor = document.getElementById('contenedor-dinamico-rsvp');
    if(contenedor) contenedor.style.display = (asisteValue === 'si') ? 'block' : 'none';
}

/**
 * 5️⃣ ENVÍO ASÍNCRONO DEL RSVP
 * Captura el formulario, genera el JSON estructurado y lo despacha hacia el backend de Spring Boot.
 */
function enviarWhatsApp() {
    const elAsiste = document.getElementById('asiste');
    const asisteValue = elAsiste ? elAsiste.value : "si";

    const elDieta = document.getElementById('dieta');
    const dietaGeneral = elDieta ? (elDieta.value || "Ninguna") : "Ninguna";

    const elNombre = document.getElementById('nombre') || document.getElementById('nombreInvitado');
    const nombreInvitado = elNombre ? (elNombre.value || "Invitado") : "Invitado";

    let payloadRSVP = {
        asiste: asisteValue === "si",
        dieta: asisteValue === "si" ? dietaGeneral : "Ninguna",
        cantidadConfirmados: 0,
        acompanantes: []
    };

    let resumenWhatsApp = "";

    if (asisteValue === "si") {
        if (CONFIG_INVITADO && CONFIG_INVITADO.tipoInvitacion && CONFIG_INVITADO.tipoInvitacion.toUpperCase() === "NOMINAL") {
            const filas = document.querySelectorAll('.fila-acompanante');
            filas.forEach(fila => {
                const inputNombre = fila.querySelector('.ac-nombre');
                const inputDieta = fila.querySelector('.ac-dieta');
                
                if (inputNombre) {
                    const name = inputNombre.value.trim();
                    const restriction = inputDieta ? (inputDieta.value.trim() || "Ninguna") : "Ninguna";
                    
                    if (name !== "") {
                        payloadRSVP.acompanantes.push({ nombre: name, dieta: restriction });
                        resumenWhatsApp += `%0A• *${name}* (Dieta: ${restriction})`;
                    }
                }
            });
            payloadRSVP.cantidadConfirmados = 1 + payloadRSVP.acompanantes.length;
        } else {
            const elCantidad = document.getElementById('cantidad');
            payloadRSVP.cantidadConfirmados = elCantidad ? parseInt(elCantidad.value) : 1;
            resumenWhatsApp = `%0A• *Total asistentes:* ${payloadRSVP.cantidadConfirmados} personas`;
        }
    } else {
        payloadRSVP.cantidadConfirmados = 0;
    }

    if (CONFIG_INVITADO && CONFIG_INVITADO.id === 999) {
        CONFIG_INVITADO.cantidadConfirmados = payloadRSVP.cantidadConfirmados;
        mostrarFeedbackExito(payloadRSVP.asiste, nombreInvitado, asisteValue, resumenWhatsApp, dietaGeneral);
        return;
    }

    fetch(`${API_BASE_URL}/invitados/confirmar?slug=${eventoSlug}&token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadRSVP)
    })
    .then(response => {
        if (!response.ok) throw new Error("Error en el servidor al confirmar asistencia.");
        return response.json();
    })
    .then(data => {
        if (CONFIG_INVITADO) {
            CONFIG_INVITADO.cantidadConfirmados = payloadRSVP.cantidadConfirmados;
        }
        mostrarFeedbackExito(payloadRSVP.asiste, nombreInvitado, asisteValue, resumenWhatsApp, dietaGeneral);
    })
    .catch(error => {
        console.error("Error al registrar RSVP:", error);
        alert("Hubo un inconveniente al guardar tu respuesta. Por favor, reinténtalo.");
    });
}

/**
 * 🌟 MUESTRA EL MODAL DE ÉXITO
 * Configura los textos del modal intermedio informando que la base de datos se actualizó correctamente.
 */
function mostrarFeedbackExito(isAsiste, nombreInvitado, asisteValue, resumenWhatsApp, dieta) {
    cerrarModal(); 
    
    const titulo = document.getElementById("feedback-titulo");
    const msg = document.getElementById("feedback-mensaje");
    
    if(isAsiste) {
        if(titulo) titulo.innerText = "¡Confirmación Guardada!";
        if(msg) msg.innerText = "Tu respuesta se registró correctamente en el sistema de la fiesta. ¡Nos alegra mucho contar con vos!";
    } else {
        if(titulo) titulo.innerText = "Respuesta Registrada";
        if(msg) msg.innerText = "Lamentamos que no puedas asistir. Tu lugar ha sido liberado correctamente.";
    }

    const btnWA = document.getElementById("btn-finalizar-wa");
    if(btnWA) {
        btnWA.onclick = () => {
            procesarRedireccionWhatsApp(nombreInvitado, asisteValue, resumenWhatsApp, dieta);
        };
    }

    const modalFeedback = document.getElementById('modalFeedback');
    if(modalFeedback) modalFeedback.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * 📱 REDIRECCIÓN REDACTADA DE WHATSAPP API
 * Despacha el mensaje estructurado en texto plano con negritas hacia el teléfono del organizador del evento.
 */
function procesarRedireccionWhatsApp(nombreInvitado, asisteValue, resumenWhatsApp, dieta) {
    const telefonoOrganizador = CONFIG_INVITADO?.evento?.telefonoOrganizador || CONFIG_INVITADO?.evento?.telefono || "549123456789";
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
 * Escucha el formulario de canciones enviando las recomendaciones de temas directo al DJ.
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
        if (btn) {
            btn.innerText = "Enviando...";
            btn.disabled = true;
        }

        const cancion = document.getElementById('cancionSugerida').value; 
        const elNombreOpt = document.getElementById('nombreInvitado') || document.getElementById('nombre');
        const nombreOpt = elNombreOpt ? elNombreOpt.value : "Invitado"; 

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
            if (btn) {
                btn.innerText = "Enviar a la Playlist";
                btn.disabled = false;
            }
            document.getElementById('mensajeExito').style.display = 'block';
            document.getElementById('cancionSugerida').value = "";
            setTimeout(() => { document.getElementById('mensajeExito').style.display = 'none'; }, 5000);
        })
        .catch(error => {
            console.error('Error enviando canción:', error);
            alert("No se pudo registrar la canción en el sistema.");
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Enviar a la Playlist";
            }
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

function cerrarModalTicketQR() {
    const modalQR = document.getElementById('modalTicketQR');
    if (modalQR) modalQR.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function cerrarModalFeedback() { 
    document.getElementById('modalFeedback').style.display = 'none'; 
    document.body.style.overflow = 'auto'; 
    
    if (CONFIG_INVITADO && CONFIG_INVITADO.cantidadConfirmados > 0) {
        abrirModalTicketQR(CONFIG_INVITADO);
    } else {
        window.location.reload();
    }
}

function copiarAlias() {
    const alias = document.getElementById('alias-text').innerText;
    navigator.clipboard.writeText(alias).then(() => {
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
    });
}

/**
 * 8️⃣ FUNCIÓN DE APERTURA GLOBAL (BOTÓN DEL CORAZÓN)
 */
function abrirInvitacion() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => { 
            overlay.style.display = 'none'; 
        }, 500);
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
            console.log("La reproducción automática de audio fue retenida por el navegador:", error);
        });
    }
}