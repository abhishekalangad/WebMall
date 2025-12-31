export interface ContactMessage {
    id: string
    name: string
    email: string
    subject: string
    message: string
    status: 'new' | 'read' | 'replied'
    reply?: string
    repliedAt?: string
    repliedBy?: string
    createdAt: string
    updatedAt: string
}

export interface ContactFormData {
    name: string
    email: string
    subject: string
    message: string
}

export interface ReplyData {
    messageId: string
    reply: string
}
