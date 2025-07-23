import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { htmlToLexical } from '@tryghost/kg-html-to-lexical';

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
				if (resource === 'convert' && operation === 'htmlToLexical') {
					const html = this.getNodeParameter('html', itemIndex, '') as string;
					const doubleStringify = this.getNodeParameter('doubleStringify', itemIndex, false) as boolean;
					item = items[itemIndex];

					const lexical = htmlToLexical(html);

					item.json.lexical = doubleStringify ? JSON.stringify(JSON.stringify(lexical)) : lexical;
					item.json.html = html;
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
