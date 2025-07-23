import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { htmlToLexical } from '@tryghost/kg-html-to-lexical';

export class HtmlToLexical implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTML to Lexical',
		name: 'htmlToLexical',
		group: ['transform'],
		version: 1,
		description: 'Converts HTML to Lexical JSON format',
		defaults: {
			name: 'HTML to Lexical',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: '<h1>Hello World</h1>',
				description: 'The HTML to convert to Lexical',
			},
			{
				displayName: 'Double Stringify',
				name: 'doubleStringify',
				type: 'boolean',
				default: true,
				description: 'Whether to double stringify the Lexical output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let html: string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				html = this.getNodeParameter('html', itemIndex, '') as string;
				item = items[itemIndex];

				const lexical = htmlToLexical(html);
				const doubleStringify = this.getNodeParameter('doubleStringify', itemIndex, false) as boolean;

				item.json.lexical = doubleStringify ? JSON.stringify(JSON.stringify(lexical)) : lexical;
				item.json.html = html;

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
