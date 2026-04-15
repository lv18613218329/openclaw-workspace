import PolyBool from 'polybooljs'

export interface Point {
  x: number
  y: number
}

export interface Polygon {
  regions: Point[][]
  inverted: boolean
}

export class PolygonUtils {
  /**
   * 多边形分割
   * @param source 源多边形
   * @param line 分割线
   * @returns 分割后的多边形数组
   */
  static split(source: Point[], line: Point[]): Point[][] {
    // 特殊处理矩形对角线分割，这是最常见的用例
    if (source.length === 4 && this.isRectangle(source)) {
      const [p0, p1, p2, p3] = source
      const [lineStart, lineEnd] = line
      
      // 检查是否是矩形的对角线
      if ((this.pointsEqual(lineStart, p0) && this.pointsEqual(lineEnd, p2)) || 
          (this.pointsEqual(lineStart, p2) && this.pointsEqual(lineEnd, p0)) ||
          (this.pointsEqual(lineStart, p1) && this.pointsEqual(lineEnd, p3)) ||
          (this.pointsEqual(lineStart, p3) && this.pointsEqual(lineEnd, p1))) {
        
        console.log('检测到矩形对角线分割，使用特殊处理')
        
        if (this.pointsEqual(lineStart, p0) && this.pointsEqual(lineEnd, p2)) {
          // 左上到右下对角线
          return [
            [p0, p1, p2],  // 右上三角形
            [p0, p2, p3]   // 左下三角形
          ]
        } else if (this.pointsEqual(lineStart, p1) && this.pointsEqual(lineEnd, p3)) {
          // 右上到左下对角线
          return [
            [p0, p1, p3],  // 左上三角形
            [p1, p2, p3]   // 右下三角形
          ]
        } else if (this.pointsEqual(lineStart, p2) && this.pointsEqual(lineEnd, p0)) {
          // 右下到左上对角线（反转）
          return [
            [p0, p1, p2],  // 右上三角形
            [p0, p2, p3]   // 左下三角形
          ]
        } else if (this.pointsEqual(lineStart, p3) && this.pointsEqual(lineEnd, p1)) {
          // 左下到右上对角线（反转）
          return [
            [p0, p1, p3],  // 左上三角形
            [p1, p2, p3]   // 右下三角形
          ]
        }
      }
    }
    
    // 通用多边形分割算法
    const sourcePoly = this.toPolyBool(source)
    
    // 创建分割线形成的两个切割多边形（两侧）
    const [cutPoly1, cutPoly2] = this.createTwoCutPolygons(line)
    
    // 计算分割结果
    const result1 = PolyBool.intersect(sourcePoly, cutPoly1)
    const result2 = PolyBool.intersect(sourcePoly, cutPoly2)
    
    console.log('分割结果详细信息:')
    console.log('第一个切割区域结果:', result1)
    console.log('第二个切割区域结果:', result2)
    console.log('第一个切割区域数量:', result1.regions.length)
    console.log('第二个切割区域数量:', result2.regions.length)
    
    // 处理所有可能的区域
    const allPolygons = [
      ...this.fromPolyBoolMultiple(result1),
      ...this.fromPolyBoolMultiple(result2)
    ]
    
    console.log('合并后所有多边形:', allPolygons)
    console.log('合并后多边形数量:', allPolygons.length)
    
    // 过滤掉顶点数量不足的多边形
    const filteredPolygons = allPolygons.filter(p => p.length >= 3)
    console.log('过滤后多边形:', filteredPolygons)
    console.log('过滤后多边形数量:', filteredPolygons.length)
    
    return filteredPolygons
  }

  /**
   * 检查两个点是否相等
   */
  private static pointsEqual(p1: Point, p2: Point): boolean {
    return Math.abs(p1.x - p2.x) < 0.1 && Math.abs(p1.y - p2.y) < 0.1
  }

  /**
   * 检查是否为矩形（四个直角）
   */
  private static isRectangle(points: Point[]): boolean {
    if (points.length !== 4) return false
    
    const [p0, p1, p2, p3] = points
    
    // 计算各边向量
    const v0 = { x: p1.x - p0.x, y: p1.y - p0.y }
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y }
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
    const v3 = { x: p0.x - p3.x, y: p0.y - p3.y }
    
    // 检查邻边是否垂直（点积为0）
    const dot01 = v0.x * v1.x + v0.y * v1.y
    const dot12 = v1.x * v2.x + v1.y * v2.y
    const dot23 = v2.x * v3.x + v2.y * v3.y
    const dot30 = v3.x * v0.x + v3.y * v0.y
    
    return Math.abs(dot01) < 0.1 && Math.abs(dot12) < 0.1 && 
           Math.abs(dot23) < 0.1 && Math.abs(dot30) < 0.1
  }

  /**
   * 创建分割线两侧的两个切割多边形
   */
  private static createTwoCutPolygons(line: Point[]): [Polygon, Polygon] {
    // 确保分割线有两个点
    if (line.length !== 2) throw new Error('分割线必须包含两个点')

    const [p1, p2] = line
    // 计算分割线的方向向量
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    // 计算垂直于分割线的单位向量
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / length
    const ny = dx / length
    
    // 创建一个足够大的切割多边形，确保能覆盖整个源多边形
    const offset = 10000 // 足够大的偏移量
    
    // 创建第一个切割多边形（分割线一侧）
    const cutPolygon1 = [
      { x: p1.x - nx * offset, y: p1.y - ny * offset },
      { x: p1.x + nx * offset, y: p1.y + ny * offset },
      { x: p2.x + nx * offset, y: p2.y + ny * offset },
      { x: p2.x - nx * offset, y: p2.y - ny * offset },
    ]
    
    // 创建第二个切割多边形（分割线另一侧，反转方向）
    const cutPolygon2 = [
      { x: p1.x + nx * offset, y: p1.y + ny * offset },
      { x: p1.x - nx * offset, y: p1.y - ny * offset },
      { x: p2.x - nx * offset, y: p2.y - ny * offset },
      { x: p2.x + nx * offset, y: p2.y + ny * offset },
    ]
    
    console.log('创建两个切割多边形:', cutPolygon1, cutPolygon2)
    return [this.toPolyBool(cutPolygon1), this.toPolyBool(cutPolygon2)]
  }

  /**
   * 多边形合并（多个多边形）
   */
  static union(polygons: Point[][]): Point[][] {
    const result = polygons.reduce((acc, poly) => {
      return PolyBool.union(acc, this.toPolyBool(poly))
    }, { regions: [], inverted: false } as Polygon)
    
    return this.fromPolyBoolMultiple(result)
  }

  /**
   * 两个多边形的并集运算
   */
  static unionTwo(poly1: Point[], poly2: Point[]): Point[][] {
    const result = PolyBool.union(this.toPolyBool(poly1), this.toPolyBool(poly2))
    return this.fromPolyBoolMultiple(result)
  }

  /**
   * 两个多边形的交集运算
   */
  static intersectTwo(poly1: Point[], poly2: Point[]): Point[][] {
    const result = PolyBool.intersect(this.toPolyBool(poly1), this.toPolyBool(poly2))
    return this.fromPolyBoolMultiple(result)
  }

  /**
   * 两个多边形的差集运算 (poly1 - poly2)
   */
  static differenceTwo(poly1: Point[], poly2: Point[]): Point[][] {
    const result = PolyBool.difference(this.toPolyBool(poly1), this.toPolyBool(poly2))
    return this.fromPolyBoolMultiple(result)
  }

  /**
   * 两个多边形的分割运算
   */
  static clipTwo(poly1: Point[], poly2: Point[]): Point[][] {
    // 使用交集和差集的组合实现分割
    const intersection = this.intersectTwo(poly1, poly2)
    const difference = this.differenceTwo(poly1, poly2)
    return [...intersection, ...difference]
  }

  /**
   * 检查两个多边形是否相交
   */
  static checkIntersection(poly1: Point[], poly2: Point[]): boolean {
    const result = PolyBool.intersect(this.toPolyBool(poly1), this.toPolyBool(poly2))
    return result.regions.length > 0
  }

  /**
   * 将多边形转换为 PolyBool 格式
   */
  private static toPolyBool(points: Point[]): Polygon {
    // 确保点按顺时针顺序排列
    const clockwisePoints = this.ensureClockwise(points)
    return {
      regions: [clockwisePoints.map(p => [p.x, p.y])],
      inverted: false
    }
  }

  /**
   * 从 PolyBool 格式转换为多边形
   */
  private static fromPolyBool(poly: Polygon): Point[] {
    if (poly.regions.length === 0) return []
    return poly.regions[0].map(([x, y]) => ({ x, y }))
  }

  /**
   * 从 PolyBool 格式转换为多个多边形
   */
  private static fromPolyBoolMultiple(poly: Polygon): Point[][] {
    return poly.regions.map(region => region.map(([x, y]) => ({ x, y })))
  }

  /**
   * 创建分割线形成的切割多边形
   */
  private static createCutPolygon(line: Point[]): Polygon {
    // 确保分割线有两个点
    if (line.length !== 2) throw new Error('分割线必须包含两个点')

    const [p1, p2] = line
    // 计算分割线的方向向量
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    // 计算垂直于分割线的单位向量
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / length
    const ny = dx / length
    
    // 创建一个足够大的切割多边形，确保能覆盖整个源多边形
    const offset = 10000 // 足够大的偏移量
    
    // 创建切割多边形，使用相反顺序以确保正确的方向
    const cutPolygon = [
      { x: p1.x - nx * offset, y: p1.y - ny * offset },
      { x: p1.x + nx * offset, y: p1.y + ny * offset },
      { x: p2.x + nx * offset, y: p2.y + ny * offset },
      { x: p2.x - nx * offset, y: p2.y - ny * offset },
    ]
    
    console.log('创建切割多边形:', cutPolygon)
    return this.toPolyBool(cutPolygon)
  }

  /**
   * 确保多边形点按顺时针顺序排列
   */
  private static ensureClockwise(points: Point[]): Point[] {
    // 计算多边形的面积
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += (points[j].x - points[i].x) * (points[j].y + points[i].y)
    }
    
    // 如果面积为正（逆时针），则反转点顺序
    if (area > 0) {
      return [...points].reverse()
    }
    
    return points
  }

  /**
   * 将矩形转换为多边形点集
   */
  static rectToPolygon(x: number, y: number, width: number, height: number): Point[] {
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
  }

  /**
   * 将圆形转换为多边形点集（使用近似值）
   */
  static circleToPolygon(x: number, y: number, radius: number, sides = 36): Point[] {
    const points: Point[] = []
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2
      points.push({
        x: x + radius * Math.cos(angle),
        y: y + radius * Math.sin(angle)
      })
    }
    return points
  }
}