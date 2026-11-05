import { extraSessionFee } from "#lib/server/payments.server"

export const load = async () => ({ extraSessionFee: await extraSessionFee() })
