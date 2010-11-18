
//-----------------------------------------------------------------------------
// Copyright (c) 2010 Patrick Mueller
// Licensed under the MIT license: 
// http://www.opensource.org/licenses/mit-license.php
//-----------------------------------------------------------------------------

require ./Point2

//----------------------------------------------------------------------------
class Point3(properties) << Point2
    super(properties)

//----------------------------------------------------------------------------
method add(aPoint)
    var result = super.add(aPoint)
    
    if (aPoint.z) {
        result.z += aPoint.z
    }
    
    return result
