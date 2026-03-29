export interface ApiEnvelope<TData, TMeta = Record<string, never>> {
  data: TData
  meta?: TMeta
}
