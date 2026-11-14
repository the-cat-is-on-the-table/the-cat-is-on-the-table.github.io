// I thank God for allowing me to program


console.warn('God is King of kings and Lord of lords')



let funs = Object.create(null)
let vars = Object.create(null)

const rootf = funs
const rootv = vars

const macro = Object.create(null)
const operator = Object.create(null)

let tracing = 1
let compiling = []
let executing = []

let pkg = Object.create(null)

const closing_parenthesis = {}

const read_table = { '"': read_string,
		     '`': () => [intern('quasiquote'), read_element()],
		     "'": () => [intern('quote'), read_element()], 
		     ',': read_unquote,
		     '#': dispatcher,
		     ';': line_comment,
		     '(': read_list,
		     ')': () => closing_parenthesis }


const escape = { t: "\t",
		 0: "\0",
		 r: "\r",
		 n: "\n",
		 v: "\v",
		 f: "\f" }

let pointer = 0
let source = ''

const number_regex = /^-?\d+\.?\d*$/

const space_regex = /\s/

const dot_regex = /^[a-z].*\..+$/i

let browserp, nodep


//wws

class symbol
{
  constructor (name)
  {
    this.name = name
  }
  toString ()
  {
    return this.name
  }
}

class keyword extends symbol {}

class Return
{
  constructor (value)
  {
    this.value = value
  }
}

class unquoted_flattened
{
  constructor (value)
  {
    this.value = value
  }
}

class iterator
{
  constructor (list)
  {
    this.list = list
    this.pointer = -1
  }
  next ()
  {
    if (++this.pointer >= this.list.length)
      this.pointer = 0
    return this.list[this.pointer]
  }
  previous ()
  {
    if (--this.pointer < 0)
      this.pointer = this.list.length - 1
    return this.list[this.pointer]
  }
  random ()
  {
    this.pointer = Math.floor(Math.random() * this.list.length)
    return this.list[this.pointer]
  }
} 

function error (...message)
{

  //werr
  
  let str = ''
  if (compiling.length)
  {
    str += 'while compiling: ' + compiling.join(' ') + ' \n'
    compiling.length = 0
  }
  
  if (executing.length)
  {
    str += 'while executing: ' + executing.join(' ') + ' \n'
    executing.length = 0
  }

  str += message.map(nullstr).join(' ')
  const oh = new Error(str)
  oh.name = '0'
  throw oh
}


function read_string ()
{
  let str = ''
  let chr
  while ((chr = source[pointer++]) !== '"')
  {
    undef(chr, '" did not find a closing "')
    if (chr === '\\')
    {
      chr = undef(source[pointer++], '\\ at the end of source code in string', str)
      if (escape[chr])
	str += escape[chr]
      else
	str += chr
    }
    else
    {
      str += chr
    }
  }
  return str
}

function dispatcher ()
{
  //dpx

  const chr = source[pointer++]
  if (chr === ';')
  {
    read_element()
    return read_element()
  }

  if (chr === "'")
    return [intern('function'), read_element()]

  if (chr === '(')
  {
    read_list()
    return read_element()
  }

  pointer--
  const sym = read_element()
  if (sym instanceof symbol)
    return intern('#' + sym.name)
  
}

function line_comment ()
{
  while (source[pointer] !== undefined && source[pointer++] !== '\n')
    ;
  return read_element()
}

function read_unquote ()
{
  const chr = source[pointer++]
  if (chr === '@')
    return [intern('unquote-flatten'), read_element()]
  pointer--
  return [intern('unquote'), read_element()]
}

function undef (value, ...message)
{
  if (value === undefined)
    error(...message)
  else
    return value
}

function nulldef (value, ...message)
{
  if (value === undefined || value === null)
    error(...message)
  else
    return value
}

function read_list ()
{
  let element
  const list = []
  while ((element = read_element()) !== closing_parenthesis)
  {
    undef(element, '( did not find a closing )')
    list.push(element)
  }
  return list
}

function read_element ()
{
  let token = ''

  let chr
  while ((chr = source[pointer++]) !== undefined && space_regex.test(chr))
    ;
  
  while (chr !== undefined && !space_regex.test(chr))
  {
    if (read_table[chr])
    {
      if (token === '')
	return read_table[chr]()
      pointer--
      return tokenize(token)
    }
    token += chr
    chr = source[pointer++]
  }

  if (token !== '')
    return tokenize(token)
}

function tokenize (token)
{
  if (number_regex.test(token))
    return parseFloat(token)
  return intern(token)
}

function intern (name)
{

  //its
  
  if (pkg[name])
    return pkg[name]
  if (name[0] === ':')
    return pkg[name] = new keyword(name.slice(1))
  if (dot_regex.test(name))
  {
    const [obj_token, ...raw_chain] = name.split('.')
    const sym = new symbol(name)
    const chain = raw_chain.map(translate_case)
    const obj_expr = undef(compile(intern(obj_token)), obj_token, 'did not return code', name)
    const len = chain.length - 1
    const last = chain[len]
    sym.traverse = f =>
    {
      let object = obj_expr()
      if (object === null || object === undefined)
	error(obj_token, 'did not return a true value', name)
      for (let i = 0; i < len; i++)
      {
	object = nulldef(object[chain[i]], chain[i], 'is not a property of', object, name)
      }
      return f(object, last)
    }
    sym.access = () =>
    {
      let object = obj_expr()
      if (object === null || object === undefined)
	error(obj_token, 'did not return a true value', name)
      for (let i = 0; i < len; i++)
      {
	object = nulldef(object[chain[i]], chain[i], 'is not a property of', object, name)
      }
      return object[last]
    }
    return pkg[name] = sym

  }
  return pkg[name] = new symbol(name)
}

function compile (element)
{

  //cps

  if (Array.isArray(element))
    return compile_list(element)
  
  if (element instanceof keyword)
  {
    const kw = element
    return () => kw
  }

  if (element instanceof symbol)
  {
    if (element.access)
    {
      const access = element.access
      return access
    }
    
    const name = element.name
    return () =>
    {
      const value = vars[name]
      if (value === undefined)
      {
	if (name in vars)
	  return value
	error('symbol', name, 'unbound')
      }
      return value
    }
  }

  if (typeof element === 'function')
    return element

  const item = element
  return () => item
}

function translate_case (str)
{
  let res = ''
  const len = str.length
  for (let i = 0; i < len; i++)
  {
    const chr = str[i]
    if (chr === '-')
      res += undef(str[++i], '- at the end of a token in translate case', str).toUpperCase()
    else if (chr === '~')
      res += '-'
    else
      res += chr
  }
  return res
}

function compile_args (list)
{
  const args = []
  const len = list.length
  for (let i = 0; i < len; i++)
    compile_into_list(list[i], args)
  return () => args.map(x => x())
}

function compile_into_list (expr, list)
{
  const value = compile(expr)
  if (value)
    list.push(value)
}

function compile_list (list)
{

  //cpl
  
  if (!list.length)
    error('compiling an empty list, why?')

  const [car, ...cdr] = list

  if (car instanceof keyword)
  {
    const obj_expr = undef(cdr.shift(), 'keyword in car of list without an object expression', list)
    const obj_code = undef(compile(obj_expr), obj_expr, 'did not return code', list)
    const method = translate_case(car.name)
    const args = compile_args(cdr)
    return () =>
    {
      const object = obj_code()
      if (object === null || object === undefined)
	error('object expression in keyword method call is nil', list)
      const f = object[method]
      if (typeof f !== 'function')
	error(method, 'is not a method of', object, 'in', list)
      return f.apply(object, args())
    }
  }

  if (car instanceof symbol)
  {
    if (car.traverse)
    {
      const args = compile_args(cdr)
      const traverse = car.traverse
      const method_call = (object, property) =>
      {
	const method = object[property]
	if (typeof method !== 'function')
	  error(car.name, property, 'is not a method of', object, 'called with:', cdr)
	return method.apply(object, args())
      }
      return () => traverse(method_call)
    }

    const name = car.name
    return compile_funcall(name, cdr)
  }

  if (Array.isArray(car))
  {
    const c = undef(compile(car), 'nested list call did not return code', car, cdr)
    const args = compile_args(cdr)
    return () =>
    {
      const f = c()
      if (typeof f !== 'function')
	error(car, 'did not return a function in nested list call', cdr)
      return f.apply(null, args())
    }
  }

  error('unknown car type when compiling list', list)
}

function compile_funcall (name, args)
{
  if (macro[name])
    return compile(macro[name].apply(null, args))

  if (operator[name])
  {
    if (tracing)
    {
      const f = operator[name].apply(null, args)
      if (f)
      {
	return () =>
	{
	  executing.push(name)
	  const value = f()
	  executing.pop()
	  return value
	}
      }
      return
    }
    return operator[name].apply(null, args)
  }

  const compiled_args = compile_args(args)
  if (tracing)
  {
    return () =>
    {
      executing.push(name)
      const fun = undef(funs[name], name, 'is not a function, macro or operator. Called with:', args)
      const result = fun.apply(null, compiled_args())
      executing.pop()
      return result
    }
  }
  return () =>
  {
    const fun = undef(funs[name], name, 'is not a function, macro or operator. Called with:', args)
    return fun.apply(null, compiled_args())
  }
} 

function interpret_string (str)
{
  const old = source
  const oldp = pointer
  try
  {
    source = str
    pointer = 0
    let element
    while ((element = read_element()) !== undefined)
    {
      const value = compile(element)
      if (value)
	value()
    }
  }
  finally
  {
    source = old
    pointer = oldp
  }
}

function interpret_string_ret (str)
{
  const old = source
  const oldp = pointer
  let result
  try
  {
    source = str
    pointer = 0
    let element
    while ((element = read_element()) !== undefined)
    {
      const value = compile(element)
      if (value)
	result = value()
    }
  }
  finally
  {
    source = old
    pointer = oldp
  }
  if (result instanceof Return)
    return result.value
  return result
}

function browser ()
{
  browserp = 1
  
  //brs

  const hide_oh = document.createElement('style')
  document.head.appendChild(hide_oh)
  hide_oh.sheet.insertRule('oh { display: none; }')

  let canvas, ctx, animation

  fsym('document', () => document)
  fsym('window', () => window)
  fsym('body', () => document.body)
  fsym('head', () => document.head)

  fsym('canvas', () => canvas)
  fsym('ctx', () => ctx)
  fsym('width', () => innerWidth)
  fsym('height', () => innerHeight)

  funs['begin-path'] = () => ctx.beginPath()
  funs['end-path'] = () => ctx.closePath()
  funs.fill = () => ctx.fill()
  funs.stroke = () => ctx.stroke()
  funs['move-to'] = (x, y) => ctx.moveTo(x, y)
  funs['line-to'] = (x, y) => ctx.lineTo(x, y)
  funs.clear = (x = 0, y = 0, w = canvas.width, h = canvas.height) => ctx.clearRect(x, y, w, h)

  funs['make-canvas'] = (width = 640, height = 480) =>
  {
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height
    document.body.appendChild(canvas)
    return canvas
  }
  funs['draw-image'] = (...args) => ctx.drawImage(...args)
  funs.rectangle = (...args) => ctx.fillRect(...args)
  funs.rect = (...args) => ctx.strokeRect(...args)
  funs.color = color => ctx.fillStyle = color
  funs['stroke-color'] = color => ctx.strokeStyle = color
  operator.animation = (...code) =>
  {
    const c = body(code)
    return () =>
    {
      const f = Object.create(funs)
      const v = Object.create(vars)
      let last
      function loop (elapsed)
      {
	v.delta = ((elapsed - last) / 1000) * 60
	last = elapsed
	with_state(c, f, v)
	animation = requestAnimationFrame(loop)
      }
      if (animation)
	cancelAnimationFrame(animation)
      last = performance.now()
      animation = requestAnimationFrame(loop)
    }
  }
  operator.listener = (element_expr, type_expr, ...code) =>
  {
    const element_ex = undef(compile(element_expr), 'listener element expression did not return code', element_expr, type_expr, code)
    const type_ex = undef(compile(type_expr), 'listener event type expression did not return code', element_expr, type_expr, code)
    const c = body(code) || (() => {})
    return () =>
    {
      const element = element_ex()
      nulldef(element, 'listener element expression did not return a true value', element, element_expr, type_expr, code)
      const type = type_ex()
      const parentf = funs
      const parentv = vars
      const handler = event =>
      {
	const f = Object.create(parentf)
	const v = Object.create(parentv)
	f['remove-handler'] = () => { element.removeEventListener(type, handler) }
	v.event = event
	with_state(c, f, v)
      }
      element.addEventListener(type, handler)
    }
  }
  

  funs.text = (element, text) => element.textContent = text
  funs.to = (parent, ...children) =>
  {
    for (let child of children)
      parent.appendChild(child)
  }
  
  operator.style = (...lists) =>
  {
    const str = css(lists)
    return () =>
    {
      const style = document.createElement('style')
      document.head.appendChild(style)
      return style.textContent = str
    }
  }
  operator.dom = (name, ...args) => dom(name, args)

  funs['load-image'] = url =>
  {
    return new Promise((resolve, reject) =>
    {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  //tgs
  make_tags('h1 h2 h3 h4 h5 h6 div p main article section img input textarea audio canvas button marquee'.split(' '))
  
  //bri
  
  window.addEventListener('load', load_scripts)

  function make_tags (names)
  {
    for (let name of names)
    {
      if (Array.isArray(name))
      {
	const [nm, l] = name
	const n = nm.toString()
	operator[l] = (...args) => dom(n, args)
      }
      else
      {
	const n = name.toString()
	operator[n] = (...args) => dom(n, args)
      }
    } 
  }

  function dom (name, list)
  {

    //dms
    
    const functions = []
    const n = name.toString()

    const len = list.length
    for (let i = 0; i < len; i++)
    {
      const arg = list[i]
      if (arg instanceof keyword)
      {
	const code = undef(compile(undef(list[++i], 'keyword without value', arg, list)), list[i], 'did not return code for keyword', arg, list)
	const an = arg.name
	functions.push(x =>
	{
	  const value = code()
	  if (value === undefined)
	    x.setAttribute(an, '')
	  else
	    x.setAttribute(an, value)
	})
      }
      else if (arg instanceof symbol)
      {
	const an = arg.name
	const an0 = an[0]
	if (an0 === '@')
	{
	  const event_type = an.slice(1)
	  const code = undef(list[++i], 'event handler without code', arg, list)
	  if (!Array.isArray(code))
	    error(an, 'expects a list of code', code, list, n)
	  const c = body(code)
	  if (!c)
	    continue
	  functions.push(x =>
	  {
	    const parentf = funs
	    const parentv = vars
	    const handler = event =>
	    {
	      const f = Object.create(parentf)
	      const v = Object.create(parentv)
	      v.event = event
	      f['remove-handler'] = () => x.removeEventListener(event_type, handler)
	      with_state(c, f, v)
	    }
	    x.addEventListener(event_type, handler)
	  })
	}
	else if (an0 === '.')
	{
	  const ns = an.slice(1)
	  functions.push(x => x.classList.add(ns))
	}
	else if (an0 === '#')
	{
	  const ns = an.slice(1)
	  functions.push(x => x.id = ns)
	}
	else if (an === 'text')
	{
	  const value = undef(compile(undef(list[++i], 'text directive without text', n, list)), list[i], 'did not return code for text directive', n, list)

	  functions.push(x => x.appendChild(document.createTextNode(nullstr(value()))))
	}
	else if (an === 'writer')
	{
	  const [property_name, fun_name] = [list[++i], list[++i]]
	  if (!symbolp(property_name))
	    error('writer property is not a symbol', property_name, n, list)
	  if (!symbolp(fun_name))
	    error('writer function name is not a symbol', fun_name, n, list)
	  const fn = fun_name.name
	  const pn = translate_case(property_name.name)
	  functions.push(element => funs[fn] = value => element[pn] = value)
	}
	else if (an[0] === '&')
	{
	  const en = an.slice(1)
	  functions.push(element => vars[en] = element)
	}
	else
	{
	  error(an, 'is not a known dom directive', n, list)
	}
      }
      else if (Array.isArray(arg))
      {
	const code = undef(compile(arg), arg, 'did not return code', n, list)
	functions.push(x =>
	{
	  const value = nulldef(code(), arg, 'did not return a value when executed', n, list)
	  if (value instanceof HTMLElement)
	    x.appendChild(value)
	  else
	    x.appendChild(document.createTextNode(value.toString()))
	})
      }
      else 
      {
	const type = typeof arg
	if (type === 'string' || type === 'boolean' || type === 'number')
	{
	  const str = arg
	  functions.push(x => x.appendChild(document.createTextNode(str)))
	}
	else
	{
	  error(n, 'unknown dom argument type', arg, type, list)
	}
      }
    }
    const flen = functions.length
    return () =>
    {
      const element = document.createElement(n)
      for (let i = 0; i < flen; i++)
	functions[i](element)
      return element
    }
  }
  async function load_scripts ()
  {
    for (let oh of [...document.getElementsByTagName('oh')])
    {
      oh.remove()
      const src = oh.getAttribute('src')
      if (src)
      {
	const res = await fetch(src)
	if (res.ok)
	  interpret_string(await res.text())
	else
	  error('failed to load', src, res)
      }
      if (oh.textContent.trim())
	interpret_string(oh.textContent)
    }
  }

}

function node ()
{
  nodep = 1

  //nps

  function repl ()
  {
    process.stdin.on('data', x =>
    {
      const str = x.toString()
      if (str === '\n')
	process.exit()
      try
      {
	console.log(interpret_string_ret(str))
      }
      catch (e)
      {
	console.error(e)
      }
    })
  }
  repl()
} 

function body (code)
{
  const len = code.length
  if (!len)
    return
  if (len === 1)
  {
    const value = compile(code[0])
    if (value)
    {
      return () =>
      {
	const result = value()
	if (result instanceof Return)
	  return result.value
	return result
      }
    }
    return
  }
  const compiled_code = []
  for (let i = 0; i < len; i++)
    compile_into_list(code[i], compiled_code)
  
  const clen = compiled_code.length
  return () =>
  {
    let result
    for (let i = 0; i < clen; i++)
    {
      result = compiled_code[i]()
      if (result instanceof Return)
	return result.value
    }
    return result
  }
}

function progn (code)
{
  const len = code.length
  if (!len)
    return

  if (len === 1)
  {
    const value = compile(code[0])
    if (value)
      return value
    return
  }

  const compiled_code = []
  for (let i = 0; i < len; i++)
    compile_into_list(code[i], compiled_code)
  const clen = compiled_code.length
  return () =>
  {
    let result
    for (let i = 0; i < clen; i++)
    {
      result = compiled_code[i]()
      if (result instanceof Return)
	return result
    }
    return result
  }
}

function make_sub (exprs)
{
  const code = []
  const explen = exprs.length
  for (let i = 0; i < explen; i++)
    compile_into_list(exprs[i], code)

  if (code.length === 0)
    return () => {}

  if (code.length === 1)
    return code[0]
  
  const len = code.length - 1
  return () =>
  {
    for (let i = 0; i < len; i++)
    {
      code[i]()
    }
    return code[len]()
  }
}

function parse_args (args)
{
  const data = {}
  data.required = []
  const total_len = args.length
  let state = 'required'
  const visited = new Set()
  for (let i = 0, rest_counter = 0; i < total_len; i++)
  {
    const arg = args[i]
    if (arg instanceof symbol)
    {
      if (arg instanceof keyword)
	error('keywords do not make sense in lambda args', arg, args)

      const name = arg.name
      if (name[0] === '&')
      {
	if (name === '&key')
	{
	  if (data.keyword)
	    error('&key is being used twice', args)
	  data.keyword = Object.create(null)
	  state = 'keyword'
	}
	else if (name === '&optional')
	{
	  if (data.optional)
	    error('&optional is being used twice', args)
	  if (state === 'keyword')
	    error('&optional cannot go after &key', args)
	  data.optional = []
	  state = 'optional'
	}
	else if (name === '&allow-other-keys')
	{
	  data.allow = true
	}
	else if (name === '&rest' || name === '&body')
	{
	  if (!data.rest)
	    data.rest = Object.create(null)
	  const rest_name = undef(args[++i], name, 'directive without name', args)
	  if (rest_name?.constructor !== symbol)
	    error(name, 'name is not a symbol', rest_name, args)
	  const n = rest_name.name
	  if (visited.has(n))
	    error(n, 'has been used before as argument and is being used again as a', name, 'argument', args)
	  visited.add(n)

	  if (data.rest[rest_counter])
	    data.rest[rest_counter].push(n)
	  else
	    data.rest[rest_counter] = [n]
	}
	else
	{
	  error('wrong lambda args directive', name, 'in', args)
	}
      }
      else
      {
	if (visited.has(name))
	  error(name, 'has been used before as argument and is being used again as', state, 'argument', args)
	visited.add(name)
	
	rest_counter++

	if (state === 'required')
	  data.required.push(name)
	else if (state === 'optional')
	  data.optional.push(name)
	else if (state === 'keyword')
	  data.keyword[name] = 1
      }
    }
    else if (Array.isArray(arg))
    {
      if (state === 'required')
      {
	error('required args cannot be a list', arg, args)
      }
      else if (state === 'optional')
      {
	const [name, default_expr, suppliedp] = arg
	if (name?.constructor !== symbol)
	  error('name in car of optional lambda argument list is not a symbol', name, arg, args)
	const n = name.name
	if (visited.has(n))
	  error(n, 'has been used before as argument and is being used again as optional argument', arg, args)
	visited.add(n)

	if (suppliedp)
	{
	  if(suppliedp?.constructor !== symbol)
	    error('supplied predicate is not a symbol', arg, args)
	  if (visited.has(suppliedp.name))
	    error(suppliedp.name, 'has been used before as argument and is being used again as a supplied predicate optional argument', args)
	  visited.add(suppliedp.name)
	}

	rest_counter++
	if (default_expr === undefined)
	{
	  data.optional.push([n, undefined, suppliedp])
	}
	else
	{
	  const code = compile(default_expr)
	  undef(code, 'default expression for optional lambda argument did not return code', default_expr, arg, args)
	  data.optional.push([n, code, suppliedp])
	}
      }
      else if (state === 'keyword')
      {
	const [name, default_expr, suppliedp] = arg
	if (name?.constructor !== symbol)
	  error('name in car of keyword lambda argument list is not a symbol', name, arg, args)
	const n = name.name
	if (visited.has(n))
	  error(n, 'has been used before as argument and is being used again as keyword argument', arg, args)
	visited.add(n)
	if (suppliedp)
	{
	  if(suppliedp?.constructor !== symbol)
	    error('supplied predicate is not a symbol', arg, args)
	  if (visited.has(suppliedp.name))
	    error(suppliedp.name, 'has been used before as argument and is being used again as a supplied predicate keyword argument', args)
	  visited.add(suppliedp.name)
	}
	rest_counter++
	if (default_expr === undefined)
	{
	  data.keyword[n] = [undefined, suppliedp]
	}
	else
	{
	  const code = compile(default_expr)
	  undef(code, 'default expression for keyword lambda argument did not return code', default_expr, arg, args)
	  data.keyword[n] = [code, suppliedp]
	}
      }
    }
    else
    {
      error('argument is not a symbol or list in lambda args', arg, args)
    }
  }
  return data
}

function bind_args (data, args)
{
  const alen = args.length
  const rargs = data.required
  const rlen = rargs.length
  if (alen < rlen)
    error('not enough required arguments', rlen, data.required, alen, args)
  let i = 0
  for (; i < rlen; i++)
    vars[rargs[i]] = args[i]
  if (data.rest)
  {
    const rest = data.rest
    const keys = Object.keys(rest)
    const klen = keys.length
    for (let j = 0; j < klen; j++)
    {
      const rindex = keys[j]
      const reargs = rest[keys[j]]
      const relen = reargs.length
      for (let rei = 0; rei < relen; rei++)
	vars[reargs[rei]] = args.slice(rindex)
    }
  }
  if (data.optional)
  {
    const optional = data.optional
    const olen = optional.length
    for (let oi = 0; oi < olen; oi++, i++)
    {
      const op = optional[oi]
      if (Array.isArray(op))
      {
	const [name, default_expr, suppliedp] = op
	if (i < alen)
	{
	  if (suppliedp)
	    vars[suppliedp.name] = true
	  vars[name] = args[i]
	}
	else
	{
	  if (suppliedp)
	    vars[suppliedp.name] = undefined

	  if (default_expr)
	    vars[name] = default_expr()
	  else
	    vars[name] = undefined
	}
      }	
      else
      {
	if (i < alen)
	  vars[op] = args[i]
	else
	  vars[op] = undefined
      }
    }
  }

  if (data.keyword)
  {
    const kw = data.keyword
    const keys = Object.keys(kw)
    const kargs = args.slice(i)
    const klen = kargs.length
    let allow = data.allow
    const to_visit = new Set(keys)
    if (klen % 2)
      error('keyword provided arguments are not pair', klen, kargs, args)
    for (let k = klen - 2; k >= 0; k -= 2)
    {
      const arg = kargs[k]
      if (!(arg instanceof keyword))
	error('keyword argument is not a keyword', arg, kargs, args)
      if (arg.name === 'allow-other-keys')
      {
	allow = kargs[k + 1]
	kargs.splice(k, 2)
      }
    }
    const rklen = kargs.length
    for (let k = 0; k < rklen; k += 2)
    {
      const key = kargs[k]
      const name = key.name
      if (kw[name])
      {
	to_visit.delete(name)
	const karg = kw[name]
	if (Array.isArray(karg))
	{
	  const suppliedp = karg[1]
	  if (suppliedp)
	    vars[suppliedp.name] = true
	  vars[name] = kargs[k + 1]
	}
	else
	{
	  vars[name] = kargs[k + 1]
	}
      }
      else if (!allow)
      {
	error('unknown keyword provided when allow-other-keys is not true', key, kargs, args)
      }
    }
    for (const name of to_visit)
    {
      const karg = kw[name]
      if (Array.isArray(karg))
      {
	const [default_expr, suppliedp] = karg
	if (suppliedp)
	  vars[suppliedp.name] = undefined
	if (default_expr !== undefined)
	  vars[name] = default_expr()
	else
	  vars[name] = undefined
      }
      else
      {
	vars[name] = undefined
      }
    }
  }
}

function lambda (lambda_args, code)
{
  if (!Array.isArray(lambda_args))
    error('lambda args are not a list', lambda_args, code)
  const f = body(code)
  if (!f)
    return () => () => {}
  const len = lambda_args.length
  if (!len)
  {
    return () =>
    {
      const parentf = funs
      const parentv = vars
      return () =>
      {
	const oldf = funs
	const oldv = vars
	try
	{
	  funs = Object.create(parentf)
	  vars = Object.create(parentv)
	  return f()
	}
	finally
	{
	  funs = oldf
	  vars = oldv
	}
      }
    }
  }
  const data = parse_args(lambda_args)
  if (!data.optional && !data.keyword && !data.rest)
  {
    const required = data.required
    const rlen = required.length
    return () =>
    {
      const parentf = funs
      const parentv = vars
      return (...args) =>
      {
	const oldf = funs
	const oldv = vars
	const alen = args.length
	if (rlen !== alen)
	  error('required arguments and provided arguments do not match', rlen, required, alen, args)
	try
	{
	  funs = Object.create(parentf)
	  vars = Object.create(parentv)
	  for (let i = 0; i < rlen; i++)
	    vars[required[i]] = args[i]
	  return f()
	}
	finally
	{
	  funs = oldf
	  vars = oldv
	}
      }
    }
  }
  return () =>
  {
    const parentf = funs
    const parentv = vars
    return (...args) =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(parentf)
	vars = Object.create(parentv)
	bind_args(data, args)
	return f()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    }
  }
}

function quasiquote (element)
{
  if (Array.isArray(element))
  {
    const car = element[0]
    if (car?.constructor === symbol)
    {
      const name = car.name
      if (name === 'unquote')
	return undef(compile(element[1]), 'unquote expression did not return code', element)

      if (name === 'unquote-flatten')
      {
	const code = undef(compile(element[1]), 'unquote-flatten expression did not return code', element)
	return () =>
	{
	  const value = code()
	  if (!Array.isArray(value))
	    error('unquote-flatten expression did not return a list value', value, element)
	  return new unquoted_flattened(value)
	}
      }

      if (name === 'quasiquote')
	return quasiquote(element[1])

    }
    const quasiquoted = element.map(quasiquote)
    const len = quasiquoted.length
    return () =>
    {
      const res = []
      for (let i = 0; i < len; i++)
      {
	const value = quasiquoted[i]()
	if (value instanceof unquoted_flattened)
	  res.push.apply(res, value.value)
	else
	  res.push(value)
      }
      return res
    }
  }

  const item = element
  return () => item
}

function fsym (name, code)
{
  Object.defineProperty(vars, name,
  {
    get: code,
    set (value)
    {
      Object.defineProperty(this, name,
        { value, writable: true, enumerable: true, configurable: true })
    },
    configurable: true
  })
}

function let_operator (bindings, ...code)
{
  const f = progn(code) || (() => {})

  const binders = []
  if (Array.isArray(bindings))
  {
    const len = bindings.length
    for (let i = 0; i < len; i++)
    {
      const binding = bindings[i]
      if (Array.isArray(binding))
      {
	const [name, ...exprs] = binding
	if (name?.constructor !== symbol)
	  error(name, 'is not a symbol in let bindings', bindings, code)
	const n = name.name
	const v = progn(exprs) || (() => {})
	binders.push(n, v) 
      }
      else if (binding instanceof symbol)
      {
	binders.push(binding.name, () => {})
      }
      else
      {
	error('let binding is not a symbol or list', binding, bindings, code)
      }
    }
  }
  else if (bindings instanceof symbol)
  {
    binders.push(bindings.name, () => {})
  }
  else
  {
    error('let bindings have an unknown type', bindings, code)
  }

  const blen = binders.length
  if (blen)
  {
    return () =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(funs)
	vars = Object.create(vars)
	for (let i = 0; i < blen; i++)
	{
	  vars[binders[i]] = binders[++i]()
	}
	return f()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    }
  }
  return () =>
  {
    const oldf = funs
    const oldv = vars
    try
    {
      funs = Object.create(funs)
      vars = Object.create(vars)
      return f()
    }
    finally
    {
      funs = oldf
      vars = oldv
    }
  }
}

function with_state (code, f, v)
{
  const oldf = funs
  const oldv = vars
  try
  {
    funs = f
    vars = v
    return code()
  }
  finally
  {
    funs = oldf
    vars = oldv
  }
}

function nullstr (str)
{
  if (!str?.toString)
    return ''
  return str.toString()
}

function css (lists)
{
  if (!Array.isArray(lists))
    error('css requires a list of lists', lists)
  let str = ''
  for (let element of lists)
  {
    if (!Array.isArray(element))
      error('css requires a list of lists', element, lists)
    const [selector, ...properties] = element
    const len = properties.length
    if (Array.isArray(selector))
    {
      str += selector.join(', ')
    }
    else
    {
      const sel = selector.toString()
      if (sel === 'font-face')
      {
	if (len !== 2)
	  error('font-face expects family name and url', properties, lists)
	str += '@font-face { font-family: "' + properties[0] + '"; src: url("' + properties[1] + '"); }\n'
	continue
      }
      str += sel
    }
    if (len % 2)
      error(selector, 'properties are not pair', len, properties, lists)
    str += ' { '
    for (let i = 0; i < len; i++)
    {
      str += properties[i] + ': '
      const value = properties[++i]
      if (Array.isArray(value))
      {
	if (Array.isArray(value[0]))
	  str += value.map(x => x.join(' ')).join(', ')
	else
	  str += value.join(' ')
      }
      else
      {
	str += value
      }
      str += '; '
    }
    str += '}\n'
  }
  return str
}

function symstr (element)
{
  nulldef(element, 'symstr argument is nil or null', element)
  if (element instanceof symbol)
    return element.name
  return element.toString()
}

function symtrs (element)
{
  nulldef(element, 'symtrs argument is nil or null', element)
  if (element instanceof keyword)
    return element.name
  if (element instanceof symbol)
    return translate_case(element.name)
  return element.toString()
}

function mutator (name, code)
{
  operator[name] = (location, value_expr) =>
  {
    if (location?.constructor !== symbol)
      error(name, 'did not receive a symbol as the location', location, value_expr)
    if (value_expr === undefined)
    {
      if (location.traverse)
      {
	const traverse = location.traverse
	return () => traverse(code)
      }
      const n = location.name
      return () =>
      {
	let e = vars
	while (e)
	{
	  if (Object.hasOwn(e, n))
	    return code(e, n)
	  e = Object.getPrototypeOf(e)
	}
	error(name, 'symbol', n, 'unbound')
      }
    }


    const value = undef(compile(value_expr), name, value_expr, 'did not return code')
    
    if (location.traverse)
    {
      const traverse = location.traverse
      const c = (obj, property) => code(obj, property, value())
      return () => traverse(c)
    }
    const n = location.name
    return () =>
    {
      let e = vars
      while (e)
      {
	if (Object.hasOwn(e, n))
	  return code(e, n, value())
	e = Object.getPrototypeOf(e)
      }
      error(name, 'symbol', n, 'unbound')
    }
  }
}

function compile_elements (elements)
{
  const res = []
  const len = elements.length
  for (let i = 0; i < len; i++)
    compile_into_list(elements[i], res)
  return res
}

function symbolp (element)
{
  return element?.constructor === symbol
}

//wds

operator.css = (...lists) =>
{
  const str = css(lists)
  return () => str
}

operator.let = let_operator

operator.quasiquote = quasiquote 
operator.quote = x => Array.isArray(x)? () => x.slice() : () => x
operator.unquote = x => error('unquote outside quasiquote', x)
operator['unquote-flatten'] = x => error('unquote flatten outside quasiquote', x)
operator.lambda = (lambda_args, ...code) => lambda(lambda_args, code)
funs.list = (...args) => args
funs.return = x => new Return(x)
funs.log = console.log.bind(console)
operator['parse-args'] = (...args) => 
{
  const parsed_args = parse_args(args)
  return () => parsed_args
}
operator.body = (...args) => body(args)
operator.progn = (...args) => progn(args)
operator.sub = (...exprs) =>
{
  const f = make_sub(exprs)
  return () => f
}

operator.defun = (name, lambda_args, ...code) =>
{
  if (name?.constructor !== symbol)
    error('defun did not receive a symbol as the name of the function', name, lambda_args, code)
  const n = name.name
  if (tracing)
  {
    compiling.push(n)
    const l = lambda(lambda_args, code)
    compiling.pop()
    return () => rootf[n] = l()
  }
  const l = lambda(lambda_args, code)
  return () => rootf[n] = l()
}

operator.defmacro = (name, lambda_args, ...code) =>
{
  if (name?.constructor !== symbol)
    error('defmacro did not receive a symbol as the name of the function', name, lambda_args, code)
  const n = name.name
  if (tracing)
  {
    compiling.push('macro ' + n)
    macro[n] = lambda(lambda_args, code)()
    compiling.pop()
  }
  else
  {
    macro[n] = lambda(lambda_args, code)()
  }
}


//ari

funs['+'] = (...args) =>
{
  const len = args.length
  let value = args[0]
  if (typeof value !== 'number')
    error('+ first argument is not a number')
  for (let i = 1; i < len; i++)
  {
    const arg = args[i]
    if (typeof arg !== 'number')
      error('+ argument number', i + 1, 'with value', arg, 'is not a number') 
    value += arg
  }
  return value
}

funs['-'] = (...args) =>
{
  const len = args.length
  let value = args[0]
  if (typeof value !== 'number')
    error('- first argument is not a number')
  for (let i = 1; i < len; i++)
  {
    const arg = args[i]
    if (typeof arg !== 'number')
      error('- argument number', i + 1, 'with value', arg, 'is not a number') 
    value -= arg
  }
  return value
}
funs['*'] = (...args) =>
{
  const len = args.length
  let value = args[0]
  if (typeof value !== 'number')
    error('* first argument is not a number')
  for (let i = 1; i < len; i++)
  {
    const arg = args[i]
    if (typeof arg !== 'number')
      error('* argument number', i + 1, 'with value', arg, 'is not a number') 
    value *= arg
  }
  return value
}

funs['/'] = (...args) =>
{
  const len = args.length
  let value = args[0]
  if (typeof value !== 'number')
    error('/ first argument is not a number')
  for (let i = 1; i < len; i++)
  {
    const arg = args[i]
    if (typeof arg !== 'number')
      error('/ argument number', i + 1, 'with value', arg, 'is not a number') 
    value /= arg
  }
  return value
}

funs['%'] = (...args) =>
{
  const len = args.length
  let value = args[0]
  if (typeof value !== 'number')
    error('% first argument is not a number')
  for (let i = 1; i < len; i++)
  {
    const arg = args[i]
    if (typeof arg !== 'number')
      error('% argument number', i + 1, 'with value', arg, 'is not a number') 
    value %= arg
  }
  return value
}

vars.math = Math
vars.console = console

funs.setp = (object, ...chain) =>
{
  const len = chain.length - 2
  if (len < 0)
    error('setp called without enough arguments', len + 2, object, chain)
  const value = chain[len + 1]
  for (let i = 0; i < len; i++)
  {
    const property = translate_case(chain[i].toString())
    object = nulldef(object[property], 'setp', property, 'is nil or null in', object, chain)
  }
  return object[translate_case(chain[len].toString())] = value
}

operator.set = (...args) =>
{
  const len = args.length
  if (len % 2)
    error('set expects a list of name value pairs', len, args)
  const setters = []
  for (let i = 0; i < len; i++)
  {
    const name = args[i]
    const value = undef(compile(args[++i]), args[i], 'did not return code', args)
    if (name instanceof symbol)
    {
      if (name.traverse)
      {
	setters.push(() => name.traverse((object, property) => object[property] = value()))
      }
      else
      {
	const n = name.name
	setters.push(() =>
	{
	  let env = vars
	  while (env)
	  {
	    if (Object.hasOwn(env, n))
	      return env[n] = value()
	    env = Object.getPrototypeOf(env)
	  }
	  error('symbol', n, 'unbound', args)
	})
      }
    }
    else
    {
      error('set expects symbols as names', name, value, args)
    }
  }

  const slen = setters.length
  if (slen)
  {
    if (slen === 1)
      return setters[0]
    return () =>
    {
      let value
      for (let i = 0; i < slen; i++)
	value = setters[i]()
      return value
    }
  }
}

operator.def = (...list) =>
{
  const len = list.length
  const binders = []
  if (len % 2)
    error('def expects pairs of symbol names and values', len, list)
  for (let i = 0; i < len; i++)
  {
    const name = list[i]
    if (name?.constructor !== symbol)
      error('name is not a symbol', name, list)
    const value = undef(compile(list[++i]), list[i], 'did not return code for', list)
    binders.push(name.name, value)
  }

  const blen = binders.length
  return () =>
  {
    let value
    for (let i = 0; i < blen; i++)
      value = vars[binders[i]] = binders[++i]()
    return value
  }
}

operator['fun-symbol'] = (name, ...code) =>
{
  const l = lambda([], code)
  if (name?.constructor !== symbol)
    error('fun-symbol expects a symbol as name', name, code)
  const n = name.name
  return () => fsym(n, l())
}

operator['fset'] = (name, code_expr) =>
{
  if (name?.constructor !== symbol)
    error('fset did not receive a symbol for the name', name, code_expr)
  const n = name.name
  const f = undef(compile(undef(code_expr, 'no code was provided for', n)), code_expr, 'did not return code for', n)
  return () =>
  {
    const fun = f()
    if (typeof fun !== 'function')
      error(code_expr, 'did not return a function for', n)
    return funs[n] = fun
  }
}

operator.dotimes = (binding, ...code) =>
{
  if (!Array.isArray(binding))
    error('dotimes binding is not a list', binding, code)
  const [name, times_expr, resultp] = binding
  if (name?.constructor !== symbol)
    error('dotimes name is not a symbol', binding, code)
  const n = name.name
  const times = undef(compile(undef(times_expr, 'dotimes did not receive an expression')), 'dotimes expression did not return code', times_expr)
  const f = progn(code)
  if (!f)
    return
  if (resultp !== undefined)
  {
    const result_expr = undef(compile(resultp), 'result expression in dotimes did not return code', resultp, binding, code)
    return () =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(funs)
	vars = Object.create(vars)
	const len = times()
	for (let i = 0; i < len; i++)
	{
	  vars[n] = i
	  const value = f()
	  if (value instanceof Return)
	    return value
	}
	return result_expr()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    }
  }
  return () =>
  {
    const oldf = funs
    const oldv = vars
    try
    {
      funs = Object.create(funs)
      vars = Object.create(vars)
      const len = times()
      for (let i = 0; i < len; i++)
      {
	vars[n] = i
	const value = f()
	if (value instanceof Return)
	  return value
      }
    }
    finally
    {
      funs = oldf
      vars = oldv
    }
  }
}

operator.dolist = (binding, ...code) =>
{
  if (!Array.isArray(binding))
    error('dolist binding is not a list', binding, code)
  const [name, list_expr, resultp] = binding
  if (name?.constructor !== symbol)
    error('dolist name is not a symbol', binding, code)
  const n = name.name
  const list_f = undef(compile(undef(list_expr, 'dolist did not receive an expression')), 'dolist expression did not return code', list_expr)
  const f = progn(code)
  if (!f)
    return
  if (resultp !== undefined)
  {
    const result_expr = undef(compile(resultp), 'result expression in dolist did not return code', resultp, binding, code)
    return () =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(funs)
	vars = Object.create(vars)
	const list = list_f()
	const len = list.length
	for (let i = 0; i < len; i++)
	{
	  vars[n] = list[i]
	  const value = f()
	  if (value instanceof Return)
	    return value
	}
	return result_expr()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    }
  }
  return () =>
  {
    const oldf = funs
    const oldv = vars
    try
    {
      funs = Object.create(funs)
      vars = Object.create(vars)
      const list = list_f()
      const len = list.length
      for (let i = 0; i < len; i++)
      {
	vars[n] = list[i]
	const value = f()
	if (value instanceof Return)
	  return value
      }
    }
    finally
    {
      funs = oldf
      vars = oldv
    }
  }
}

operator.bench = (...code) =>
{
  const f = body(code)
  return () =>
  {
    const start = performance.now()
    const value = f()
    const end = performance.now()
    return [((end - start) / 1000).toFixed(7), value]
  }
}

operator.wait = (...code) =>
{
  const clen = code.length
  const list = []
  for (let i = 0; i < clen; i++)
    compile_into_list(code[i], list)
  const len = list.length
  return () =>
  {
    const parentf = funs
    const parentv = vars
    return (async () =>
    {
      let result
      const f = Object.create(parentf)
      const v = Object.create(parentv)
      v.result = undefined
      for (let i = 0; i < len; i++)
      {
	const value = result = with_state(list[i], f, v)
	if (value instanceof Promise)
	  result = v.result = await value
      }
      return result
    })()
  }
}

operator.try = (expr, ...catch_code) =>
{
  const e = undef(compile(expr), 'try expression did not return code', expr)
  const c = undef(body(catch_code), 'try has no catch code')
  return () =>
  {
    try
    {
      return e()
    }
    catch (e)
    {
      const f = Object.create(funs)
      const v = Object.create(vars)
      v.error = e
      return with_state(c, f, v)
    }
  }
}

operator.promise = (...code) =>
{
  const f = body(code)
  if (!f)
    return () => new Promise(() => {})
  
  return () =>
  {
    const parentf = funs
    const parentv = vars
    return new Promise((resolve, reject) =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(parentf) 
	vars = Object.create(parentv) 
	funs.resolve = resolve
	funs.reject = reject
	f()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    })
  }
}

operator.timeout = (time_expr, ...code) =>
{
  const time = undef(compile(undef(time_expr, 'timeout without time expression', code)), 'timeout time expression did not return code', time_expr, code)
  const f = body(code)
  if (!f)
    return
  return () =>
  {
    const parentf = funs
    const parentv = vars
    return setTimeout(() =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(parentf)
	vars = Object.create(parentv)
	f()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    }, time())
  }
}

operator.interval = (time_expr, ...code) =>
{
  const time = undef(compile(undef(time_expr, 'interval without time expression', code)), 'interval time expression did not return code', time_expr, code)
  const f = body(code)
  if (!f)
    return
  return () =>
  {
    const parentf = funs
    const parentv = vars
    return setInterval(() =>
    {
      const oldf = funs
      const oldv = vars
      try
      {
	funs = Object.create(parentf)
	vars = Object.create(parentv)
	f()
      }
      finally
      {
	funs = oldf
	vars = oldv
      }
    }, time())
  }
}

operator.function = name =>
{
  if (name instanceof symbol)
  {
    const n = name.name
    return () => undef(funs[n], 'function operator did not find the function', n)
  }
  error('function did not receive a symbol', name)
}

funs.fetch = fetch
funs['fetch-json'] = async url =>
{
  const res = await fetch(url)
  if (res.ok)
    return await res.json()
  else
    error('failed to fetch json', url, res)
}

funs.iterator = x => new iterator(x)

funs.object = (...stuff) =>
{
  const len = stuff.length
  if (len % 2)
    error('object did not receive a pair number of arguments', len, stuff)
  const object = Object.create(null)
  for (let i = 0; i < len; i++)
    object[symtrs(stuff[i])] = stuff[++i]
  return object
}

operator.obj = (...stuff) =>
{
  const strs = stuff.map(x =>
  {
    if (Array.isArray(x))
      return [symstr(x[0]), symtrs(x[1])]
    return [symstr(x), symtrs(x)]
  })
  const len = strs.length
  return () =>
  {
    const object = Object.create(null)
    for (let i = 0; i < len; i++)
    {
      const [oh_name, js_name] = strs[i]
      const value = vars[oh_name]
      if (value === undefined && !(oh_name in vars))
	error('obj name', oh_name, 'is unbound')
      object[js_name] = value
    }
    return object
  }
}

operator.properties = (object_expr, ...raw_names) =>
{
  const obj_expr = undef(compile(object_expr), 'properties object expression did not return code', object_expr)
  const names = raw_names.map(symtrs)
  const len = names.length
  return () =>
  {
    const object = obj_expr()
    const list = []
    for (let i = 0; i < len; i++)
    {
      const name = names[i]
      const value = object[name]
      if (value === undefined && !(name in object))
	error('properties property', name, 'is not a property of', object)
      list.push(value)
    }
    return list
  }
}

operator['bind-properties'] = (object_expr, ...stuff) =>
{
  const obj_expr = undef(compile(object_expr), 'bind-properties object expression did not return code', object_expr)

  const strs = stuff.map(x =>
  {
    if (Array.isArray(x))
      return [symstr(x[0]), symtrs(x[1])]
    return [symstr(x), symtrs(x)]
  })
  const len = strs.length
  return () =>
  {
    const object = obj_expr()
    for (let i = 0; i < len; i++)
    {
      const [js_name, oh_name] = strs[i]
      const value = object[oh_name]
      if (value === undefined && !(oh_name in object))
	error('bind-properties name', oh_name, 'is not a property of', object)
      vars[js_name] = value
    }
  }
}


operator.if = (test_code, true_branch, else_branch) =>
{
  const test = undef(compile(test_code), 'if did not receive code from the test value expression')
  const t = compile(true_branch) || (() => {}) 
  if (else_branch === undefined)
    return () => { if (test()) { return t() } }
  const f = compile(else_branch) || (() => {}) 
  return () =>
  {
    if (test())
      return t()
    return f()
  }
}

funs.random = x => Math.floor(Math.random() * x)

funs.not = x => !x


mutator('increment', (obj, property, value = 1) =>
{
  const v = obj[property]
  if (typeof v !== 'number')
    error('increment trying to increment a non number value', property, 'of', obj, value)
  if (typeof value !== 'number')
    error('increment received a non number value to increment', property, 'of', obj, 'with the value', value)
  return obj[property] += value
})

mutator('decrement', (obj, property, value = 1) =>
{
  const v = obj[property]
  if (typeof v !== 'number')
    error('decrement trying to increment a non number value', property, 'of', obj, value)
  if (typeof value !== 'number')
    error('decrement received a non number value to increment', property, 'of', obj, 'with the value', value)
  return obj[property] -= value
})

funs.equal = (x, y) => x == y
funs.eq = (x, y) => x === y
funs.less = (x, y) => x < y
funs.greater = (x, y) => x > y
funs['less-or-equal'] = (x, y) => x <= y
funs['greater-or-equal'] = (x, y) => x >= y

operator.case = (value_expr, ...cases) =>
{
  const value = undef(compile(value_expr), 'case test value expression did not return code', value_expr, cases)

  const jump_table = Object.create(null)
  let otherwise
  for (let c of cases)
  {
    if (!Array.isArray(c))
      error('case', value_expr, 'received a non list element', c, cases)
    const [test_sym, ...code_body] = c
    const code = progn(code_body) || (() => {})
    const sym_type = typeof test_sym
    if (Array.isArray(test_sym))
    {
      for (let test of test_sym)
      {
	const type = typeof test
	if (type === 'number' || type === 'string')
	  jump_table[test] = code
	else if (test?.constructor === symbol)
	  jump_table[test.name] = code
	else
	  error('nested list in case has an element that is not a symbol, string or number as one of the tests', test, test_sym, c, cases)
      }
    }
    else if (sym_type === 'number' || sym_type === 'string')
    {
      jump_table[test_sym] = code
    }
    else if (test_sym instanceof symbol)
    {
      const n = test_sym.name
      if (test_sym instanceof keyword)
      {
	if (n === 'otherwise')
	  otherwise = code
	else
	  error('case test cannot be a keyword except the :otherwise keyword', test_sym, c, cases)
      }
      else
      {
	jump_table[n] = code
      }
    }
    else
    {
      error('case test is not a symbol or list', test_sym, c, cases)
    }
  }
  if (otherwise)
  {
    return () =>
    {
      const v = value()
      if (jump_table[v])
	return jump_table[v]()
      return otherwise()
    } 
  }
  return () =>
  {
    const v = value()
    if (jump_table[v])
      return jump_table[v]()
  }
}

operator.and = (...exprs) =>
{
  const exs = compile_elements(exprs)
  const len = exs.length
  return () =>
  {
    let value
    for (let i = 0; i < len; i++)
    {
      value = exs[i]()
      if (!value)
	return value
    }
    return value
  }
}

operator.or = (...exprs) =>
{
  const exs = compile_elements(exprs)
  const len = exs.length
  return () =>
  {
    let value
    for (let i = 0; i < len; i++)
    {
      value = exs[i]()
      if (value)
	return value
    }
    return value
  }
}

funs.between = (x, y, z) => x >= y && x <= z

funs.half = x => x / 2
funs.double = x => x * 2
funs.negative = x => x < 0
funs.positive = x => x >= 0

funs['2d-array'] = (max_x, max_y) =>
{
  const list = []
  for (let i = 0; i < max_x; i++)
  {
    const x = []
    list.push[x]
    for (let j = 0; j < max_y; j++)
      x.push({})
  }
  return list
}

funs.number = x => new Number(x)

operator.while = (test_expr, ...code) =>
{
  const test = undef(compile(undef(test_expr, 'while without test expression', code)), 'while test expression did not return code', test_expr, code)

  const c = progn(code) || (() => {})
  
  return () =>
  {
    while (test())
    {
      c()
    }
  }
}

funs.cat = (...args) => args.join('')

//wse

vars.t = vars.true = true
vars.f = vars.false = false
vars.nil = undefined
vars.null = null



fsym('God', () => { console.warn('God is King of Kings and Lord of lords'); return 777 })



interpret_string(`
(defmacro when (test &body code)
 \`(if ,test (progn ,@code)))
(defmacro unless (test &body code)
 \`(when (not ,test) ,@code))
`)

if (typeof window === 'undefined')
  node()
else
  browser()
