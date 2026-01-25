function abrirInvitacion() {
    const audio = document.getElementById('musicaFondo');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('main-content');

    if (audio) {
        audio.play().catch(error => console.log("Reproducción automática bloqueada"));
    }

    overlay.classList.add('hidden');

    setTimeout(() => {
        content.classList.add('visible');
        document.body.style.overflow = 'auto';
    }, 800);
}

// Cuenta Regresiva
const fechaFiesta = new Date("June 20, 2026 21:00:00").getTime();

setInterval(function() {
    const ahora = new Date().getTime();
    const distancia = fechaFiesta - ahora;

    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    document.getElementById("days").innerText = dias < 10 ? "0" + dias : dias;
    document.getElementById("hours").innerText = horas < 10 ? "0" + horas : horas;
    document.getElementById("minutes").innerText = minutos < 10 ? "0" + minutos : minutos;
    document.getElementById("seconds").innerText = segundos < 10 ? "0" + segundos : segundos;
}, 1000);