import OpenAI from 'openai';

export async function qualifyLead(text: string): Promise<QualificationResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // prompt para calificar el lead segun el icp
  const prompt = `
    Analiza los datos de un lead y decide si encaja con nuestro ICP.

    ICP:
    - Industria: Empresa de servicios o consultoría.
    - Tamaño: Minimo 5 empleados.
    - Ubicacion: España o Latinoamerica.
    - Interes: Automatizacion o Inteligencia Artificial.

    Datos del lead:
    "${text}"

    Responde en JSON con esta estructura:
    {
      "qualified": boolean,
      "reason": "Explicacion de 2 o 3 lineas."
    }
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Asistente de calificacion en JSON.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No hay respuesta');

  return JSON.parse(content) as QualificationResult;
}
