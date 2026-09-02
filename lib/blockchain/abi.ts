export const poapAbi = [
  {type:'function',name:'totalEvents',stateMutability:'view',inputs:[],outputs:[{type:'uint256'}]},
  {type:'function',name:'events',stateMutability:'view',inputs:[{name:'',type:'uint256'}],outputs:[{name:'name',type:'string'},{name:'description',type:'string'},{name:'eventDate',type:'uint256'},{name:'location',type:'string'},{name:'allowlistRoot',type:'bytes32'},{name:'svgImage',type:'address'},{name:'creator',type:'address'},{name:'createdAt',type:'uint256'},{name:'externalUrl',type:'string'},{name:'isSoulbound',type:'bool'},{name:'isPublic',type:'bool'}]},
  {type:'function',name:'uri',stateMutability:'view',inputs:[{name:'eventId',type:'uint256'}],outputs:[{type:'string'}]},
  {type:'function',name:'hasClaimed',stateMutability:'view',inputs:[{type:'uint256'},{type:'address'}],outputs:[{type:'bool'}]},
  {type:'function',name:'balanceOf',stateMutability:'view',inputs:[{type:'address'},{type:'uint256'}],outputs:[{type:'uint256'}]},
  {type:'function',name:'registerEvent',stateMutability:'nonpayable',inputs:[{type:'string',name:'name'},{type:'string',name:'description'},{type:'uint256',name:'eventDate'},{type:'string',name:'location'},{type:'bytes32',name:'allowlistRoot'},{type:'string',name:'svgImage'},{type:'string',name:'externalUrl'},{type:'uint8',name:'flags'}],outputs:[{type:'uint256',name:'eventId'}]},
  {type:'function',name:'mint',stateMutability:'nonpayable',inputs:[{type:'uint256',name:'eventId'}],outputs:[]},
  {type:'function',name:'allowlistMint',stateMutability:'nonpayable',inputs:[{type:'uint256',name:'eventId'},{type:'bytes32[]',name:'merkleProof'}],outputs:[]},
  {type:'function',name:'mintWithSignature',stateMutability:'nonpayable',inputs:[{type:'uint256',name:'eventId'},{type:'bytes',name:'signature'}],outputs:[]},
  {type:'function',name:'creatorMint',stateMutability:'nonpayable',inputs:[{type:'uint256',name:'eventId'},{type:'address[]',name:'recipients'}],outputs:[]},
  {type:'function',name:'updateAllowlistRoot',stateMutability:'nonpayable',inputs:[{type:'uint256',name:'eventId'},{type:'bytes32',name:'newRoot'}],outputs:[]},
  {type:'function',name:'updateEventPublic',stateMutability:'nonpayable',inputs:[{type:'uint256',name:'eventId'},{type:'bool',name:'isPublic'}],outputs:[]},
  {type:'event',name:'NewEvent',inputs:[{indexed:true,name:'eventId',type:'uint256'},{indexed:false,name:'name',type:'string'},{indexed:true,name:'creator',type:'address'}]},
  {type:'event',name:'NewMint',inputs:[{indexed:true,name:'eventId',type:'uint256'},{indexed:true,name:'recipient',type:'address'}]}
] as const
