// Simple avatar service for browser - no AWS SDK dependencies
class S3AvatarService {
  constructor() {
    this.bucketName = 'dev-dbz-avatars-311141566875';
    this.baseUrl = `https://${this.bucketName}.s3.amazonaws.com`;
  }

  // Get the base URL for avatars
  getAvatarUrl(avatarName) {
    return `${this.baseUrl}/${avatarName}`;
  }

  // Get all available avatars (simplified for browser)
  async listAvatars() {
    // Return predefined avatars for browser compatibility
    return {
      success: true,
      avatars: this.getPredefinedAvatars().map(avatar => ({
        key: `dbz/${avatar.name}.png`,
        name: avatar.name,
        url: avatar.url,
        size: 0,
        lastModified: new Date()
      }))
    };
  }

  // Upload avatar to S3 (placeholder for browser)
  async uploadAvatar(file, avatarName) {
    console.warn('Avatar upload not available in browser - use AWS console instead');
    return {
      success: false,
      error: 'Avatar upload not available in browser'
    };
  }

  // Delete avatar from S3 (placeholder for browser)
  async deleteAvatar(avatarKey) {
    console.warn('Avatar deletion not available in browser - use AWS console instead');
    return {
      success: false,
      error: 'Avatar deletion not available in browser'
    };
  }

  // Get predefined Dragon Ball Z avatars
  getPredefinedAvatars() {
    const avatars = [
      { name: 'goku', displayName: 'Goku', url: this.getAvatarUrl('dbz/goku.png') },
      { name: 'vegeta', displayName: 'Vegeta', url: this.getAvatarUrl('dbz/vegeta.png') },
      { name: 'gohan', displayName: 'Gohan', url: this.getAvatarUrl('dbz/gohan.png') },
      { name: 'piccolo', displayName: 'Piccolo', url: this.getAvatarUrl('dbz/piccolo.png') },
      { name: 'trunks', displayName: 'Trunks', url: this.getAvatarUrl('dbz/trunks.png') },
      { name: 'goku_black', displayName: 'Goku Black', url: this.getAvatarUrl('dbz/goku_black.png') },
      { name: 'frieza', displayName: 'Frieza', url: this.getAvatarUrl('dbz/frieza.png') },
      { name: 'cell', displayName: 'Cell', url: this.getAvatarUrl('dbz/cell.png') },
      { name: 'majin_buu', displayName: 'Majin Buu', url: this.getAvatarUrl('dbz/majin_buu.png') },
      { name: 'beerus', displayName: 'Beerus', url: this.getAvatarUrl('dbz/beerus.png') },
      { name: 'whis', displayName: 'Whis', url: this.getAvatarUrl('dbz/whis.png') },
      { name: 'jiren', displayName: 'Jiren', url: this.getAvatarUrl('dbz/jiren.png') },
      { name: 'hit', displayName: 'Hit', url: this.getAvatarUrl('dbz/hit.png') },
      { name: 'caulifla', displayName: 'Caulifla', url: this.getAvatarUrl('dbz/caulifla.png') },
      { name: 'kale', displayName: 'Kale', url: this.getAvatarUrl('dbz/kale.png') },
      { name: 'broly', displayName: 'Broly', url: this.getAvatarUrl('dbz/broly.png') },
      { name: 'android18', displayName: 'Android 18', url: this.getAvatarUrl('dbz/android18.png') },
      { name: 'krillin', displayName: 'Krillin', url: this.getAvatarUrl('dbz/krillin.png') },
      { name: 'tien', displayName: 'Tien', url: this.getAvatarUrl('dbz/tien.png') },
      { name: 'yamcha', displayName: 'Yamcha', url: this.getAvatarUrl('dbz/yamcha.png') },
      { name: 'nappa', displayName: 'Nappa', url: this.getAvatarUrl('dbz/nappa.png') },
      { name: 'raditz', displayName: 'Raditz', url: this.getAvatarUrl('dbz/raditz.png') },
      { name: 'dodoria', displayName: 'Dodoria', url: this.getAvatarUrl('dbz/dodoria.png') },
      { name: 'zarbon', displayName: 'Zarbon', url: this.getAvatarUrl('dbz/zarbon.png') },
      { name: 'ginyu', displayName: 'Ginyu', url: this.getAvatarUrl('dbz/ginyu.png') },
      { name: 'jeice', displayName: 'Jeice', url: this.getAvatarUrl('dbz/jeice.png') },
      { name: 'burter', displayName: 'Burter', url: this.getAvatarUrl('dbz/burter.png') },
      { name: 'recoome', displayName: 'Recoome', url: this.getAvatarUrl('dbz/recoome.png') },
      { name: 'cabba', displayName: 'Cabba', url: this.getAvatarUrl('dbz/cabba.png') },
      { name: 'toppo', displayName: 'Toppo', url: this.getAvatarUrl('dbz/toppo.png') },
      { name: 'zamasu', displayName: 'Zamasu', url: this.getAvatarUrl('dbz/zamasu.png') },
      { name: 'goten', displayName: 'Goten', url: this.getAvatarUrl('dbz/goten.png') }
    ];

    return avatars;
  }

  // Get random avatar
  getRandomAvatar() {
    const avatars = this.getPredefinedAvatars();
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
  }

  // Get avatar by name
  getAvatarByName(name) {
    const avatars = this.getPredefinedAvatars();
    return avatars.find(avatar => avatar.name === name) || avatars[0];
  }
}

export default new S3AvatarService();
