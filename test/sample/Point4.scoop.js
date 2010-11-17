
//-----------------------------------------------------------------------------
// Copyright (c) 2010 Patrick Mueller
// Licensed under the MIT license: 
// http://www.opensource.org/licenses/mit-license.php
//-----------------------------------------------------------------------------

require ./Point3

//----------------------------------------------------------------------------
class Point4(properties) << Point3
    $super(this, null, properties)

//----------------------------------------------------------------------------
method add(aPoint)
    var result = $super(this, "add", aPoint)
    
    if (aPoint.a) {
        result.a += aPoint.a
    }
    
    return result

//----------------------------------------------------------------------------
method toString
    return $super(this, "toString")
