export type AuthenticationRequest = {
  uuid: string;
  pan: number;
  expirationDate: Date;
  amount: number;
  verificationCode: number;
  challengeResultURL: string;
  redirectURL: string;
};

export type AuthenticationResponse = {
  uuid: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  statusCode: 0 | 1 | -1;
  message: string;
  isEnrolled: boolean;
  redirectURL: string;
};

export type AuthorizationRequest = {
  debitPan: number;
  creditPAN: number;
  expirationDate: Date;
  amount: number;
  verificationCode: number;
};

export type AuthorizationResponse = {
  uuid: string;
  status: 'SUCCESS' | 'FAILURE';
  message: string;
  statusCode: 0 | 1 | -1;
};
