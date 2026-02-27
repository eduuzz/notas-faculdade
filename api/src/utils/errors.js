export class PortalError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class PortalAuthError extends PortalError {
  constructor(message = 'Credenciais inválidas ou acesso negado pelo portal') {
    super(message, 401);
  }
}

export class PortalConnectionError extends PortalError {
  constructor(message = 'Não foi possível conectar ao portal da universidade') {
    super(message, 502);
  }
}

export class PortalParseError extends PortalError {
  constructor(message = 'Erro ao interpretar dados do portal') {
    super(message, 422);
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  if (!(err instanceof PortalError)) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json({
    error: {
      type: err.name || 'Error',
      message,
    },
  });
}
