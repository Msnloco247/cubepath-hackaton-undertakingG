const invalidReq = await fetch("http://localhost:3000/api/preguntas", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ubicacion: "Ca", // invalido, muy corto
    respuestasCliente: ["Test"]
  })
});
console.log("Invalid Req:", await invalidReq.json());

const validReq = await fetch("http://localhost:3000/api/preguntas", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ubicacion: "Caracas, Venezuela",
    respuestasCliente: [
      "¿Cuál es el producto o servicio que vas a ofrecer?: Desarrollo de software a la medida",
      "¿Qué necesidad va a satisfacer?: Digitalización de pequeños negocios locales",
      "¿A quién va dirigido?: Dueños de tiendas físicas y abastos",
      "Medios de pago: Transferencias, PagoMóvil, Zelle"
    ],
    contexto: "Tenemos un equipo de 3 desarrolladores junior."
  })
});
console.log("Valid Req:", JSON.stringify(await validReq.json(), null, 2));
