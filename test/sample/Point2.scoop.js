
//-----------------------------------------------------------------------------
// Copyright (c) 2010 Patrick Mueller
// Licensed under the MIT license: 
// http://www.opensource.org/licenses/mit-license.php
//-----------------------------------------------------------------------------

//----------------------------------------------------------------------------
class Point2(properties)
    if (!properties) return
    
    for (var key in properties) {
        this[key] = properties[key]
    }

//----------------------------------------------------------------------------
method add(aPoint)
    var result = new this.constructor(this)
    
    result.x += aPoint.x
    result.y += aPoint.y
    
    return result

//----------------------------------------------------------------------------
method toString
    var result = this.constructor.name + "{ "

    result += "x:" + this.x + "; "
    result += "y:" + this.y + "; "
    
    result += "}"
    
    return result
