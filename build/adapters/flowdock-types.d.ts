export interface FlowdockInboxItem {
    content: string;
    from_address: string;
    source: string;
    subject: string;
    tags?: string[];
    roomId: string;
}
