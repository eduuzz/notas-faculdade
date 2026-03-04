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

export class PortalTimeoutError extends PortalError {
  constructor(message = 'O portal demorou muito para responder') {
    super(message, 504);
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isKnownError = err instanceof PortalError;

  // Log no servidor (sem expor stack completo)
  if (!isKnownError) {
    console.error('[ERROR]', err.message);
  }

  // Erros 500 não expõem detalhes internos ao cliente
  const clientMessage = isKnownError || statusCode < 500
    ? err.message
    : 'Erro interno do servidor';

  res.status(statusCode).json({
    error: {
      type: isKnownError ? err.name : 'Error',
      message: clientMessage,
      code: statusCode,
    },
  });
}
