/**
 * @description Script de prueba para verificar los delays y el bloqueo por IP.
 * Se debe ejecutar con el servidor corriendo.
 */

const BASE_URL = "http://localhost:3000/api/preguntas/foda-zona";

const payload = {
    ubicacion: "Caracas, Venezuela",
    respuestasCliente: [
      "¿Cuál es el producto o servicio que vas a ofrecer?: Venta de café artesanal",
      "¿Qué necesidad va a satisfacer?: Proveer café de especialidad a domicilio",
      "¿A quién va dirigido?: Amantes del café y oficinas",
      "Medios de pago: Transferencias y efectivo"
    ],
    contexto: "Prueba de delay"
};

async function testDelays() {
    console.log("--- INICIANDO PRUEBA DE DELAYS ---");

    // 1. Primera petición: Debería tener un delay de ~5s
    console.log("\n[1] Enviando primera petición (debería tardar ~5s)...");
    const start1 = Date.now();
    try {
        const res1 = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const duration1 = (Date.now() - start1) / 1000;
        console.log(`Respuesta recibida en ${duration1.toFixed(2)}s. Status: ${res1.status}`);
        
        if (res1.status !== 200) {
            console.error("Error en la primera petición:", await res1.json());
        }
    } catch (e) {
        console.error("Error en fetch 1:", e);
    }

    // 2. Segunda petición inmediata: Debería fallar con 429
    console.log("\n[2] Enviando segunda petición inmediata (debería fallar con 429)...");
    try {
        const res2 = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        console.log(`Status: ${res2.status}`);
        const data2 = await res2.json();
        console.log("Respuesta 429:", JSON.stringify(data2, null, 2));
        
        if (res2.status === 429) {
            console.log("✅ Bloqueo de 3 minutos verificado correctamente.");
        } else {
            console.error("❌ El bloqueo falló, se esperaba 429.");
        }
    } catch (e) {
        console.error("Error en fetch 2:", e);
    }

    console.log("\n--- PRUEBA COMPLETADA ---");
}

testDelays();
