function splitDates(startDate, endDate) {
    const start = new Date(startDate.substring(0, 4), startDate.substring(4, 6) - 1, startDate.substring(6, 8));
    const end = new Date(endDate.substring(0, 4), endDate.substring(4, 6) - 1, endDate.substring(6, 8));
  
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // 시작일부터 종료일까지의 총 일 수
  
    const interval = Math.ceil(totalDays / 5); // 각 구간의 길이 계산
  
    const results = [];
    let current = new Date(start);
  
    for (let i = 0; i < 5; i++) {
        let startOfPeriod = new Date(current);
        let endOfPeriod = new Date(startOfPeriod.getTime() + (interval - 1) * (1000 * 60 * 60 * 24)); // 현재 기간의 끝일 계산
        if (endOfPeriod > end) {
            endOfPeriod = new Date(end);
        }
        results.push([
            `${startOfPeriod.getFullYear()}${String(startOfPeriod.getMonth() + 1).padStart(2, '0')}${String(startOfPeriod.getDate()).padStart(2, '0')}`,
            `${endOfPeriod.getFullYear()}${String(endOfPeriod.getMonth() + 1).padStart(2, '0')}${String(endOfPeriod.getDate()).padStart(2, '0')}`
        ]);
        current = new Date(endOfPeriod.getTime() + (1000 * 60 * 60 * 24)); // 다음 기간의 시작일 계산
    }
  
    return results;
}

// 테스트
console.log(splitDates("20220101", "20241117"));
