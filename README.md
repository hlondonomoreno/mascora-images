
# Mascora Image API

Microservicio para redimensionar imágenes a 1000x700 px con fondo degradado desde el color dominante hacia `#d7810e80`.

## Endpoint

POST `/process`

**Body (form-data)**:
- `file`: imagen JPG o PNG

**Response**:
```json
{
  "status": "ok",
  "result": {
    "url": "https://<tu-servidor>/output/imagen.png"
  }
}
```
