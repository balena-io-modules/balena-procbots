interface Fragment {
	signature: boolean;
	hidden: boolean;
	quoted: boolean;
	content: string;
}

declare module 'emailreplyparser' {
	class EmailReplyParser {
		public static read(email: string): {
			fragments: Fragment[];
			found_visible: boolean;
		};
	}
}
