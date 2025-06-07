// api/saveToNotion.js
const withErrorHandling = require('../utils/withErrorHandling');

module.exports = withErrorHandling(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { title } = req.body;

  if (!title) {
    return res.status(422).json({ error: 'Falta el campo "title"' });
  }

  // Aquí iría tu lógica real de guardar en Notion
  // await saveToNotion(title);

  res.status(200).json({ success: true, message: 'Guardado OK' });
});
