import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { htmlToLexical } from '@tryghost/kg-html-to-lexical';
import LexicalHTMLRenderer = require('@tryghost/kg-lexical-html-renderer');

export class GhostUtils implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ghost Utils',
		name: 'ghostUtils',
		icon: 'file:ghostutils.svg',
		group: ['transform'],
		version: 1,
		description: 'A collection of utility nodes for Ghost',
		defaults: {
			name: 'Ghost Utils',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Convert',
						value: 'convert',
					},
				],
				default: 'convert',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'convert',
						],
					},
				},
				options: [
					{
						name: 'HTML to Lexical',
						value: 'htmlToLexical',
						action: 'Convert HTML to lexical',
					},
					{
						name: 'Lexical to HTML',
						value: 'lexicalToHtml',
						action: 'Convert lexical to HTML',
					},
				],
				default: 'htmlToLexical',
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				displayOptions: {
					show: {
						resource: [
							'convert',
						],
						operation: [
							'htmlToLexical',
						],
					},
				},
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: '<h1>Hello World</h1>',
				description: 'The HTML to convert to Lexical',
			},
			{
				displayName: 'Lexical',
				name: 'lexical',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['convert'],
						operation: ['lexicalToHtml'],
					},
				},
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: '{"root":{...}}',
				description: 'The Lexical to convert to HTML',
			},
			{
				displayName: 'Target',
				name: 'target',
				type: 'options',
				options: [
					{
						name: 'HTML',
						value: 'html',
					},
					{
						name: 'Email',
						value: 'email',
					},
				],
				default: 'html',
				displayOptions: {
					show: {
						resource: ['convert'],
						operation: ['lexicalToHtml'],
					},
				},
				description: 'The target output format',
			},
			{
				displayName: 'Double Stringify',
				name: 'doubleStringify',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: [
							'convert',
						],
						operation: [
							'htmlToLexical',
						],
					},
				},
				description: 'Whether to double stringify the Lexical output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0, 'convert') as string;
		const operation = this.getNodeParameter('operation', 0, 'htmlToLexical') as string;

		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];
				if (resource === 'convert') {
					if (operation === 'htmlToLexical') {
						const html = this.getNodeParameter('html', itemIndex, '') as string;
						const doubleStringify = this.getNodeParameter('doubleStringify', itemIndex, false) as boolean;

						const lexical = htmlToLexical(html);

						item.json.lexical = doubleStringify
							? JSON.stringify(JSON.stringify(lexical))
							: lexical;
						item.json.html = html;
					} else if (operation === 'lexicalToHtml') {
						const lexical = this.getNodeParameter('lexical', itemIndex, '') as string;
						const target = this.getNodeParameter('target', itemIndex, 'html') as 'html' | 'email';

						const renderer = new LexicalHTMLRenderer();
						const html = await renderer.render(lexical, { target });

						item.json.html = html;
						item.json.lexical = lexical;
					}
				}
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
